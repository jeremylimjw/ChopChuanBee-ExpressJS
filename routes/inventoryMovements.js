var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { InventoryMovement } = require('../models/InventoryMovement');
const { PurchaseOrderItem, PurchaseOrder } = require('../models/PurchaseOrder');
const { SalesOrderItem, SalesOrder } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');
const { Supplier } = require('../models/Supplier');
const { Product } = require('../models/Product');
const { Sequelize } = require('sequelize');


router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { product_name, movement_type_id, start_date, end_date } = req.query;

    const queries = {};
    const purchaseOrderItem = { model: PurchaseOrderItem, include: [{ model: PurchaseOrder, include: [Supplier]}] };
    const salesOrderItem = { model: SalesOrderItem, include: [{ model: SalesOrder, include: [Customer]}] };
    const product = { model: Product };

    if (product_name != null) {
        product.where = { name: { [Sequelize.Op.iLike]: `%${product_name}%` } };
    }
    if (movement_type_id != null) {
        queries.movement_type_id = movement_type_id;
    }
    if (start_date != null && end_date != null) {
        queries.created_at = { [Sequelize.Op.between]: [start_date, end_date] };
    }
    
    try {
        const results = await InventoryMovement.findAll({ where: queries, include: [purchaseOrderItem, salesOrderItem, product]});
        res.send(results);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});

module.exports = router;