var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { POStatus } = require('../models/PurchaseOrder');
const Log = require('../models/Log');
const ViewType = require('../common/ViewType');
const { Product } = require('../models/Product');
const { Payment, PaymentMethod } = require('../models/Payment');
const { InventoryMovement } = require('../models/InventoryMovement');
const { parseRequest, assertNotNull } = require('../common/helpers');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');
const { ChargedUnder, Customer } = require('../models/Customer');
const { SalesOrder, SalesOrderItem } = require('../models/SalesOrder');
const { sequelize } = require('../db');
const MovementType = require('../common/MovementTypeEnum');
const PaymentTermType = require('../common/PaymentTermType');
const AccountingTypeEnum = require('../common/AccountingTypeEnum');
const axios = require('axios');
const { DeliveryOrder } = require('../models/DeliveryOrder');
const PaymentMethodType = require('../common/PaymentMethodType');


router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const predicate = parseRequest(req.query);

  try {
    predicate.include = [
      { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
      { model: Payment, include: [PaymentMethod] },
      Customer,
      ChargedUnder
    ];
    const results = await SalesOrder.findAll(predicate);

    res.send(results);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  // Validation here
  try {
    assertNotNull(req.body, ['customer_id', 'sales_order_status_id', 'sales_order_items'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newRecord = await SalesOrder.create(req.body, { include: [SalesOrderItem] });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} created a sales order with ID ${newRecord.id}`, 
    });

    res.send(newRecord.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.put('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { id, sales_order_items, sales_order_status_id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['id'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await SalesOrder.update(req.body, { where: { id } });

    if (result[0] === 0) {
      res.status(400).send(`Sales order ID ${id} not found.`)

    } else {

      if (sales_order_items != null) {
        // Update order items
        const salesOrderItems = await SalesOrderItem.findAll({ where: { sales_order_id: id }});
        // Remove deleted order items
        for (let item of salesOrderItems) {
          if (sales_order_items.filter(x => x.id == item.id).length === 0) {
            await SalesOrderItem.destroy({ where: { id: item.id }});
          }
        }
        // Upsert remaining items
        for (let item of sales_order_items) {
          await SalesOrderItem.upsert(item);
        }
      }

      // Record to admin logs
      const user = res.locals.user;
      let text = `${user.name} updated sales order ID ${id}.`

      if (sales_order_status_id != null) {
        const opKey = Object.keys(PurchaseOrderStatusType).filter(key => PurchaseOrderStatusType[key].id == sales_order_status_id);
        text = `${user.name} updated sales order ID ${id} to ${opKey.length ? PurchaseOrderStatusType[opKey].name : 'Unknown' }.`
      }

      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.SCM.id,
        text: text, 
      });

      res.send({ id: id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/confirm', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['id'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const salesOrder = await SalesOrder.findByPk(id, { include: [{ model: SalesOrderItem, include: [Product] }] });

    // Calculate payment(s) to add
    const payment = {
      sales_order_id: salesOrder.id, 
      movement_type_id: MovementType.SALE.id,
    }

    let total = salesOrder.sales_order_items.reduce((prev, current) => prev + current.quantity * (current.unit_price || 0), 0) || 0;
    total = total * (1+salesOrder.gst_rate/100) + (+salesOrder.offset);
    total = Math.floor(total*100)/100; // Truncate trailing decimals 

    if (salesOrder.payment_term_id === PaymentTermType.CASH.id) {
      payment.amount = total;
      payment.payment_method_id = salesOrder.payment_method_id;

    } else if (salesOrder.payment_term_id === PaymentTermType.CREDIT.id) {
      payment.amount = -total;
      payment.accounting_type_id = AccountingTypeEnum.RECEIVABLE.id;

    }
    
    // Calculate inventory movements to add
    const inventoryMovements = salesOrder.sales_order_items.map(x => ({
      product_id: x.product_id,
      sales_order_item_id: x.id,
      quantity: -x.quantity,
      unit_price: x.unit_price*(1+salesOrder.gst_rate/100),
      movement_type_id: MovementType.SALE.id,
    }))
    
    // Validate Inventory Movements if have enough quantity
    let reducedMovements = [];
    try {
      reducedMovements = await reduceInventoryMovements(inventoryMovements);
    } catch(err) {
      res.status(400).send(err);
      return;
    }
    
    // Add delivery order if needed
    if (salesOrder.has_delivery) {
      // Validate valid postal code location
      let coords = {};
      try {
        coords = await getGeoCoords(salesOrder.delivery_postal_code)
      } catch(err) {
        res.status(400).send(err);
        return;
      }

      const deliveryOrder = {
        sales_order_id: salesOrder.id,
        address: salesOrder.delivery_address,
        postal_code: salesOrder.delivery_postal_code,
        remarks: salesOrder.delivery_remarks,
        ...coords,
      }

      await DeliveryOrder.create(deliveryOrder);
    }


    await InventoryMovement.bulkCreate(reducedMovements);
    await Payment.create(payment);
    salesOrder.sales_order_status_id = PurchaseOrderStatusType.ACCEPTED.id;
    salesOrder.save();

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} updated completed sales order ID ${id}`
    });
    
    const includes = [
      { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
      { model: Payment, include: [PaymentMethod] },
      Customer,
      ChargedUnder
    ];
    const newSalesOrder = await SalesOrder.findByPk(id, { include: includes });
    res.send(newSalesOrder); // return entire sales order

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// cancel sales order
router.post('/cancel', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['id'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const salesOrder = await SalesOrder.findByPk(id, { 
      include: [
        { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
        { model: Payment, include: [PaymentMethod] },
      ] 
    });

    // Calculate payment(s) to add
    const payment = {
      sales_order_id: salesOrder.id,
      movement_type_id: MovementType.REFUND.id,
      amount: -(salesOrder.payments.filter(x => x.payment_method_id != null).reduce((prev, current) => prev += +current.amount, 0)), // flip to negative sign since its refund
      accounting_type_id: salesOrder.payment_term_id === PaymentTermType.CREDIT.id ? 1 : null,
      payment_method_id: PaymentMethodType.CASH.id,
    }

    // Calculate inventory movements to add
    const inventoryMovements = salesOrder.sales_order_items.map(x => {
      let unitCost = 0;
      for (var i = x.inventory_movements.length - 1; i >= 0; i--) { // iterate backwards
        if (x.inventory_movements[i].quantity < 0) {
          unitCost = x.inventory_movements[i].unit_cost; // if first inventory movement from the bottom of the array has negative quantity, it is the latest
          break;
        }
      }

      return {
        product_id: x.product_id,
        sales_order_item_id: x.id,
        quantity: -(x.inventory_movements.reduce((prev, current) => prev + current.quantity, 0)), // flip negative sign to positive
        unit_cost: unitCost,
        movement_type_id: MovementType.REFUND.id,
      }
    })

    await InventoryMovement.bulkCreate(inventoryMovements);
    await Payment.create(payment);
    salesOrder.sales_order_status_id = PurchaseOrderStatusType.CANCELLED.id;
    salesOrder.save();

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} cancelled sales order ID ${id}`
    });
    
    const includes = [
      { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
      { model: Payment, include: [PaymentMethod] },
      Customer,
      ChargedUnder
    ];
    const newSalesOrder = await SalesOrder.findByPk(id, { include: includes });
    res.send(newSalesOrder); // return entire sales order

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/payment', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { sales_order_id, amount, payment_method_id, accounting_type_id, movement_type_id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['sales_order_id', 'amount', 'movement_type_id']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newPayment = await Payment.create(req.body);

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} made payment to sales order ID ${sales_order_id}`, 
    });

    res.send(newPayment.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


// For new sales order
router.post('/inventory', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { inventory_movements } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['inventory_movements']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  // Validate Inventory Movements if have enough quantity
  let reducedMovements = [];
  try {
    reducedMovements = await reduceInventoryMovements(inventory_movements);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newInventoryMovements = await InventoryMovement.bulkCreate(reducedMovements);

    // Record to admin logs
    const user = res.locals.user;
    const logs = [];
    for (let movement of inventory_movements) {
      const salesOrderItem = await SalesOrderItem.findByPk(movement.sales_order_item_id, { include: Product });
      logs.push(({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} made a sale for ${salesOrderItem.product.name} with ${Math.abs(movement.quantity)} quantity`, 
      }))
    }
    await Log.bulkCreate(logs);

    res.send(newInventoryMovements)

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});




// For sales refund
router.post('/inventory/refund', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { inventory_movements } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['inventory_movements']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newInventoryMovements = await InventoryMovement.bulkCreate(inventory_movements);

    // Record to admin logs
    const user = res.locals.user;
    const logs = [];
    for (let movement of inventory_movements) {
      const product = await Product.findByPk(movement.product_id);
      logs.push(({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} refunded ${product.name} with ${Math.abs(movement.quantity)} quantity`, 
      }))
    }
    await Log.bulkCreate(logs);

    res.send(newInventoryMovements)

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


async function reduceInventoryMovements(inventory_movements) {
  // Reduce duplicated product's quantity
  const reducedMovements = [];
  inventory_movements.forEach(movement => {
    const index = reducedMovements.findIndex(x => x.product_id === movement.product_id);
    if (index > -1) {
      reducedMovements.quantity += +movement.quantity;
    } else {
      reducedMovements.push(movement)
    }
  });

  for (let movement of reducedMovements) {
    const stocks = await sequelize.query(
      `
      WITH o AS (SELECT COALESCE(-1*SUM(quantity),0) AS outflow FROM inventory_movements im WHERE quantity < 0 AND product_id = $1)
      SELECT *, CASE WHEN (sum_over-(SELECT outflow FROM o)) > quantity THEN quantity ELSE (sum_over-(SELECT outflow FROM o)) END remaining
        FROM  
          (
            SELECT 
              created_at, product_Id, unit_cost, unit_price, quantity, movement_type_id, SUM(quantity) OVER(ORDER BY created_at) AS sum_over 
            FROM inventory_movements im WHERE product_id = $1 AND quantity > 0
          ) i  
          WHERE i.sum_over-(SELECT outflow FROM o) >= 0 AND (sum_over-(SELECT outflow FROM o)) > 0;
      `,
      { 
        bind: [movement.product_id],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    const stockBalance = stocks.reduce((prev, current) => prev += +current.remaining, 0);

    if (stockBalance < Math.abs(movement.quantity)) {
      const product = await Product.findByPk(movement.product_id);
      throw `${product.name} does not have enough stock (left ${stockBalance}) for order quantity ${Math.abs(movement.quantity)}`;
    }

    let target = Math.abs(movement.quantity); // quantity in request will be negative
    let sum = 0;
    let count = 0;
    
    for (let stock of stocks) {
      let toAdd = target - count;
      if (toAdd < stock.remaining) { // If got leftover
        sum += toAdd * stock.unit_cost;
        count += toAdd;
      } else {
        sum += stock.quantity * stock.unit_cost;
        count += stock.quantity;
      }
      if (count >= target) break;
    }

    movement.unit_cost = sum/count;
  }
    
  return reducedMovements;
}

async function getGeoCoords(postal_code) {
  // Retrieve geocoordinates of the delivery destination
  const { data: geocode } = await axios.get(`https://developers.onemap.sg/commonapi/search`, {
    params: {
      searchVal: postal_code,     // Keywords entered by user that is used to filter out the results.
      returnGeom: 'Y',            // Checks if user wants to return the geometry.
      getAddrDetails: 'Y',        // Checks if user wants to return address details for a point.
      pageNum: 1,                 // Specifies the page to retrieve your search results from.
    }
  })
  
  if (geocode.results.length === 0) {
    throw `Could not find any location with the postal code ${postal_code}`;
  }

  const coords = {
    longitude: geocode.results[0].LONGITUDE,
    latitude: geocode.results[0].LATITUDE,
  }

  return coords;
}


module.exports = router;
