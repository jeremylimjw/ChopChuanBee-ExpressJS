var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const Log = require('../models/Log');
const ViewType = require('../common/ViewType');
const { Product } = require('../models/Product');
const { Payment, PaymentMethod } = require('../models/Payment');
const { InventoryMovement } = require('../models/InventoryMovement');
const { parseRequest, assertNotNull } = require('../common/helpers');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');
const { ChargedUnder, Customer } = require('../models/Customer');
const { SalesOrder, SalesOrderItem, updateSalesOrder, buildNewPayment, buildRefundPayment, validateOrderItems, validateAndBuildNewInventories, buildDeliveryOrder, buildRefundInventories } = require('../models/SalesOrder');
const { DeliveryOrder, generateAndSaveQRCode } = require('../models/DeliveryOrder');
const { Sequelize } = require('sequelize');


router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { id, sales_order_status_id, payment_term_id, customer_id, customer_name, start_date, end_date } = req.query;
  
  // Build associations to return
  const customerInc = { model: Customer };
  const include = [
    { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
    { model: Payment, include: [PaymentMethod] },
    ChargedUnder,
    customerInc,
  ];

  // Build query
  const where = {};
  if (id != null)
    where.id = id;
  if (sales_order_status_id != null)
    where.sales_order_status_id = sales_order_status_id;
  if (payment_term_id != null)
    where.payment_term_id = payment_term_id;
  if (customer_id != null)
    where.customer_id = customer_id;
  if (customer_name != null)
  customerInc.where = { company_name: { [Sequelize.Op.iLike]: `%${customer_name}%` } };
  if (start_date != null && end_date != null)
    where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };

  // Build order
  const order = [
    ['created_at', 'DESC'],
    [Payment, 'created_at', 'ASC'], 
    [SalesOrderItem, InventoryMovement, 'created_at', 'ASC']
  ];

  try {
    const results = await SalesOrder.findAll({ where: where, include: include, order: order });

    res.send(results);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
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


// 'Save for later' use case
router.put('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { id, has_delivery, sales_order_status_id } = req.body;

  let deliveryOrder;
  // Validation here
  try {
    assertNotNull(req.body, ['id'])

    // Validate delivery postal code if delivery is opted for
    if (has_delivery) {
      deliveryOrder = await buildDeliveryOrder(req.body);
    }
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    await updateSalesOrder(req.body);
    
    // Create Delivery Orders only when saving SO in other statuses other than PENDING
    if (sales_order_status_id !== PurchaseOrderStatusType.PENDING.id) {
      // Update associated delivery order
      if (has_delivery) {
        // If have existing then do update, else create a new do
        const exists = await DeliveryOrder.findAll({ where: { sales_order_id: id }});
        if (exists.length > 0) {
          await DeliveryOrder.update({
            address: deliveryOrder.address,
            postal_code: deliveryOrder.postal_code,
            longitude: deliveryOrder.longitude,
            latitude: deliveryOrder.latitude,
            remarks: deliveryOrder.remarks,
          }, { where: { sales_order_id: id }})
        } else {
          const newDeliveryOrder = await DeliveryOrder.create(deliveryOrder);

          // Create QR Code
          await generateAndSaveQRCode(newDeliveryOrder);
        }
      } else {
        await DeliveryOrder.destroy({ where: { sales_order_id: id }})
      }
    }
    
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} edited sales order ID ${id}.`, 
    });

    res.send({ id: id });

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/confirm', requireAccess(ViewType.CRM, true), async function(req, res, next) {
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
    let total = salesOrder.sales_order_items.reduce((prev, current) => prev + current.quantity * (current.unit_price || 0), 0) || 0;
    total = total * (1+salesOrder.gst_rate/100) + (+salesOrder.offset);
    total = Math.floor(total*100)/100; // Truncate trailing decimals 

    const payment = buildNewPayment(salesOrder.id, total, salesOrder.payment_term_id, salesOrder.payment_method_id);

    // Calculate inventory movements to add
    let inventoryMovements;
    let deliveryOrder;
    try {
      // Validate order items does not exceed stock count
      await validateOrderItems(salesOrder.toJSON().sales_order_items);
      // Build the inventory movements to create
      inventoryMovements = await validateAndBuildNewInventories(salesOrder, salesOrder.toJSON().sales_order_items);
      
      if (salesOrder.has_delivery) {
        deliveryOrder = await buildDeliveryOrder(salesOrder);
      }

    } catch(err) {
      res.status(400).send(err);
      return;
    }

    // Update sales order status
    salesOrder.sales_order_status_id = PurchaseOrderStatusType.ACCEPTED.id;
    await salesOrder.save();
    // Create payment
    await Payment.create(payment);
    // Create inventory Movements
    await InventoryMovement.bulkCreate(inventoryMovements);

    // Create delivery order
    if (deliveryOrder) {
      const newDeliveryOrder = await DeliveryOrder.create(deliveryOrder);

      // Create QR Code
      await generateAndSaveQRCode(newDeliveryOrder);
    }

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
    const order = [[Payment, 'created_at', 'ASC'], [SalesOrderItem, InventoryMovement, 'created_at', 'ASC']];
    const newSalesOrder = await SalesOrder.findByPk(id, { include: includes, order: order });
    res.send(newSalesOrder); // return entire sales order

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// cancel sales order
router.post('/cancel', requireAccess(ViewType.CRM, true), async function(req, res, next) {
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
    const refundAmount = salesOrder.payments.filter(x => x.payment_method_id != null).reduce((prev, current) => prev += +current.amount, 0);
    const payment = buildRefundPayment(salesOrder.id, refundAmount, salesOrder.payment_term_id);

    // Calculate inventory movements to add, es unit_cost for the movements
    const movements = salesOrder.toJSON().sales_order_items.map(x => ({
      ...x, 
      top_up: Math.abs(x.inventory_movements.reduce((prev, current) => prev + current.quantity, 0)), // sum will be in negative, Math.abs() to flip to positive
    }))
    const inventoryMovements = await buildRefundInventories(movements);

    // Delete any delivery orders
    await DeliveryOrder.destroy({ where: { sales_order_id: id }});

    // Create payment
    await Payment.create(payment);
    // Create inventory movements
    await InventoryMovement.bulkCreate(inventoryMovements);
    // Update sales order status
    salesOrder.sales_order_status_id = PurchaseOrderStatusType.CANCELLED.id;
    await salesOrder.save();

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
    const order = [[Payment, 'created_at', 'ASC'], [SalesOrderItem, InventoryMovement, 'created_at', 'ASC']];
    const newSalesOrder = await SalesOrder.findByPk(id, { include: includes, order: order });
    res.send(newSalesOrder); // return entire sales order

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// Handles new payment or refund payment
router.post('/payment', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { sales_order_id, amount, type, payment_method_id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['sales_order_id', 'amount', 'type']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const salesOrder = await SalesOrder.findByPk(sales_order_id);
    let payment;
    if (type === 'NEW') {
      payment = buildNewPayment(salesOrder.id, amount, salesOrder.payment_term_id, payment_method_id);
    } else if (type === 'REFUND') {
      payment = buildRefundPayment(salesOrder.id, amount, salesOrder.payment_term_id, payment_method_id);
    }
    const newPayment = await Payment.create(payment);

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


// For sales refund
router.post('/inventory/refund', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { inventory_movements } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['inventory_movements']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const inventoryMovements = await buildRefundInventories(inventory_movements);
    const newInventoryMovements = await InventoryMovement.bulkCreate(inventoryMovements);

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

module.exports = router;
