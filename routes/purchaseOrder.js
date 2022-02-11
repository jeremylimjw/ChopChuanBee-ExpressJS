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
const { Sequelize } = require('sequelize');
const PurchaseOrderStatusType = require('../common/PurchaseOrderStatusType');


router.get('/', requireAccess(ViewType.GENERAL, false), async function(req, res, next) {
  // This is a dynamic query where user can search using any column
  const predicate = parseRequest(req.query);

  try {
    predicate.include = [{ model: PurchaseOrderItem, include: [InventoryMovement, Product] }, Supplier, PaymentTerm, POStatus, { model: Payment, include: [PaymentMethod] }];
    predicate.order = [['created_at', 'DESC']]
    const purchaseOrders = await PurchaseOrder.findAll(predicate);
    res.send(purchaseOrders);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/', requireAccess(ViewType.GENERAL, true), async function(req, res, next) {
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
      { supplier_id, purchase_order_status_id, purchase_order_items }, 
      { include: [PurchaseOrderItem] });

    // Record to admin logs
    const user = res.locals.user;
    Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.GENERAL.id,
      text: `${user.name} created a purchase order with ID ${newPurchaseOrder.id}`, 
    });

    res.send(newPurchaseOrder.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.put('/', requireAccess(ViewType.GENERAL, true), async function(req, res, next) {
  const { id, purchase_order_items, payments, purchase_order_status_id } = req.body;

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
        const purchaseOrder = await PurchaseOrder.findByPk(id, { include: [{ model: PurchaseOrderItem, include: InventoryMovement }, Payment] });
        for (let item of purchaseOrder.purchase_order_items) {
          if (purchase_order_items.filter(x => x.id == item.id).length === 0) {
            await PurchaseOrderItem.destroy({ where: { id: item.id }});
          }
        }
        for (let item of purchase_order_items) {
          await PurchaseOrderItem.upsert(item);
        }
      }
      
      if (payments != null) {
        for (let payment of payments) {
          await Payment.upsert({ ...payment, purchase_order_id: id });
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
        view_id: ViewType.GENERAL.id,
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


module.exports = router;
