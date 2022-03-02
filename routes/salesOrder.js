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


// Create inventory movements in bulk
router.post('/inventory', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { inventory_movements } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['inventory_movements']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
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
        res.status(400).send(`${product.name} does not have enough stock (left ${stockBalance}) for order quantity ${Math.abs(movement.quantity)}`);
        return;
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


module.exports = router;
