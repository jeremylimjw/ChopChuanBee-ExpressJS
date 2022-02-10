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


router.get('/', requireAccess(ViewType.SCM, false), async function(req, res, next) {
  // This is a dynamic query where user can search using any column
  const predicate = parseRequest(req.query);

  try {
    predicate.include = [{ model: PurchaseOrderItem, include: [InventoryMovement, Product] }, Supplier, PaymentTerm, POStatus, { model: Payment, include: [PaymentMethod] }];
    const purchaseOrders = await PurchaseOrder.findAll(predicate);
    res.send(purchaseOrders);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


// router.get('/item', async function(req, res, next) {
//   // This is a dynamic query where user can search using any column
//   // const predicate = parseRequest(req.query, ['supplier_item_name']);

//   const { supplier_id, supplier_item_name } = req.query;

//   try {
//     // predicate.include = [{ model: PurchaseOrder, include: [Supplier] }];
//     const purchaseOrders = await PurchaseOrderItem.findAll({ 
//       where: {
//         supplier_item_name: { [Sequelize.Op.iLike] : `%${supplier_item_name}%` }
//       },
//       include: [
//         { model: PurchaseOrder, where: { supplier_id: supplier_id } },
//         Product
//       ] 
//     });
//     // const purchaseOrders = await PurchaseOrderItem.findAll({ where: { 'purchase_order.supplier_id': supplier_id }, include: [PurchaseOrder] });
//     res.send(purchaseOrders);

//   } catch(err) {
//     console.log(err);
//     res.status(500).send(err);
//   }

// });


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
      { supplier_id, purchase_order_status_id, purchase_order_items }, 
      { include: [PurchaseOrderItem] });

    // Record to admin logs
    const user = res.locals.user;
    Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} created a purchase order with ID ${newPurchaseOrder.id}`, 
    });

    res.send(newPurchaseOrder.toJSON())

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


// router.put('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
//   const { id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description } = req.body;

//   // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
//   if (id == null || company_name == null 
//       || p1_name == null || p1_phone_number == null 
//       || address == null || postal_code == null 
//       || charged_under_id == null || gst == null || gst_show == null) {
//     res.status(400).send("'id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show' are required.", )
//     return;
//   }

//   try {
//     const result = await Customer.update(
//       { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description },
//       { where: { id: id } }
//     );

//     // If 'id' is not found return 400 Bad Request, if found then return the 'id'
//     if (result[0] === 0) {
//       res.status(400).send(`Customer id ${id} not found.`)

//     } else {
//       // Record to admin logs
//       const user = res.locals.user;
//       await Log.create({ 
//         employee_id: user.id, 
//         view_id: ViewType.CRM.id,
//         text: `${user.name} updated ${company_name}'s customer record`, 
//       });

//       res.send({ id: id });
//     }


//   } catch(err) {
//     // Catch and return any uncaught exceptions while inserting into database
//     console.log(err);
//     res.status(500).send(err);
//   }

// });


// router.delete('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
//   const { id } = req.query;

//   // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
//   if (id == null) {
//     res.status(400).send("'id' is required.", )
//     return;
//   }

//   try {
//     const customer = await Customer.findByPk(id);

//     // If 'id' is not found return 400 Bad Request, if found then return the 'id'
//     if (customer == null) {
//       res.status(400).send(`Customer id ${id} not found.`)

//     } else {
//       customer.deleted = true;
//       customer.save();

//       // Record to admin logs
//       const user = res.locals.user;
//       await Log.create({ 
//         employee_id: user.id, 
//         view_id: ViewType.CRM.id,
//         text: `${user.name} deleted ${customer.company_name}'s customer record`, 
//       });

//       res.send({ id: customer.id });
//     }


//   } catch(err) {
//     // Catch and return any uncaught exceptions while inserting into database
//     console.log(err);
//     res.status(500).send(err);
//   }

// });


module.exports = router;
