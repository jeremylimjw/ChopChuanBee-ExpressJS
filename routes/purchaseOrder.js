var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { PurchaseOrder, PurchaseOrderItem, PaymentTerm, POStatus } = require('../models/PurchaseOrder');
const Log = require('../models/Log');
const ViewType = require('../common/ViewType');
const { Supplier } = require('../models/Supplier');
const { Product } = require('../models/Product');
const { Payment, PaymentMethod } = require('../models/Payment');
const { InventoryMovement } = require('../models/InventoryMovement');
const { parseRequest, assertNotNull } = require('../common/helpers');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');
const { ChargedUnder } = require('../models/Customer');
const { Sequelize } = require('sequelize');
const { sendEmailTo } = require('../emailer');


router.get('/', requireAccess(ViewType.GENERAL, false), async function(req, res, next) {
  const { id, purchase_order_status_id, payment_term_id, supplier_id, supplier_name, start_date, end_date } = req.query;
  
  // Build associations to return
  const supplierInc = { model: Supplier };
  const include = [
    { model: PurchaseOrderItem, include: [InventoryMovement, Product] }, 
    { model: Payment, include: [PaymentMethod] },
    ChargedUnder,
    supplierInc,
  ];

  // Build query
  const where = {};
  if (id != null)
    where.id = id;
  if (purchase_order_status_id != null)
    where.purchase_order_status_id = purchase_order_status_id;
  if (payment_term_id != null)
    where.payment_term_id = payment_term_id;
  if (supplier_id != null)
    where.supplier_id = supplier_id;
  if (supplier_name != null)
    supplierInc.where = { company_name: { [Sequelize.Op.iLike]: `%${supplier_name}%` } };
  if (start_date != null && end_date != null)
    where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };

  // Build order
  const order = [
    ['created_at', 'DESC'],
    [Payment, 'created_at', 'ASC'], 
    [PurchaseOrderItem, InventoryMovement, 'created_at', 'ASC']
  ];

  try {
    const purchaseOrders = await PurchaseOrder.findAll({ where: where, include: include, order: order });

    res.send(purchaseOrders);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { supplier_id, purchase_order_status_id, purchase_order_items } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['supplier_id', 'purchase_order_status_id', 'purchase_order_items'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newPurchaseOrder = await PurchaseOrder.create(
      req.body, 
      { include: [PurchaseOrderItem] });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.SCM.id,
      text: `${user.name} created a purchase order with ID ${newPurchaseOrder.id}`, 
    });

    res.send(newPurchaseOrder.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.put('/', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { id, purchase_order_items, purchase_order_status_id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['id'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await PurchaseOrder.update(req.body, { where: { id } });

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Purchase order ID ${id} not found.`)

    } else {

      if (purchase_order_items != null) {
        // Update order items
        const purchaseOrder = await PurchaseOrder.findByPk(id, { include: [PurchaseOrderItem] });
        for (let item of purchaseOrder.purchase_order_items) {
          if (purchase_order_items.filter(x => x.id == item.id).length === 0) {
            await PurchaseOrderItem.destroy({ where: { id: item.id }});
          }
        }
        for (let item of purchase_order_items) {
          await PurchaseOrderItem.upsert(item);
        }
      }

      // Record to admin logs
      const user = res.locals.user;
      let text = `${user.name} updated purchase order ID ${id}.`

      if (purchase_order_status_id != null) {
        const opKey = Object.keys(PurchaseOrderStatusType).filter(key => PurchaseOrderStatusType[key].id == purchase_order_status_id);
        text = `${user.name} updated purchase order ID ${id} to ${opKey.length ? PurchaseOrderStatusType[opKey].name : 'Unknown' }.`
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


router.post('/payment', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { purchase_order_id, amount, payment_method_id, accounting_type_id, movement_type_id } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['purchase_order_id', 'amount', 'movement_type_id']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newPayment = await Payment.create({ purchase_order_id, amount, payment_method_id, accounting_type_id, movement_type_id });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.SCM.id,
      text: `${user.name} made payment to purchase order ID ${purchase_order_id}`, 
    });

    res.send(newPayment.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


// Create inventory movements in bulk
router.post('/inventory', requireAccess(ViewType.SCM, true), async function(req, res, next) {
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
      const purchaseOrderItem = await PurchaseOrderItem.findByPk(movement.purchase_order_item_id, { include: Product });
      logs.push(({ 
        employee_id: user.id, 
        view_id: ViewType.SCM.id,
        text: `${user.name} received delivery for ${purchaseOrderItem.product.name} with ${movement.quantity} quantity`, 
      }))
    }
    await Log.bulkCreate(logs);

    res.send(newInventoryMovements)

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


// Send email to supplier
router.post('/sendEmail', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { id, document } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['id', 'document']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const purchaseOrder = await PurchaseOrder.findByPk(id, { include: [Supplier] });

    sendEmailTo(purchaseOrder.supplier.company_email, "purchaseOrder", { 
      document: Buffer.from(document), 
      supplier: purchaseOrder.supplier 
    })

    purchaseOrder.purchase_order_status_id = PurchaseOrderStatusType.SENT_EMAIL.id;
    await purchaseOrder.save();

    res.send({ id: id })

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
