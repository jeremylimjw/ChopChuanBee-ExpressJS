var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Product } = require('../models/Product');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { SupplierMenu, GUEST_ID, Supplier } = require('../models/Supplier');
const { sequelize } = require('../db');
const { InventoryMovement } = require('../models/InventoryMovement');
const { PurchaseOrderItem, PurchaseOrder } = require('../models/PurchaseOrder');
const { SalesOrderItem, SalesOrder } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');


router.get('/', requireAccess(ViewType.INVENTORY, false), async function(req, res, next) {
  const { id, name, status } = req.query;

  try {
    const results = await sequelize.query(
      `
        SELECT 
          p.id, p.name, p.min_inventory_level, p.deactivated_date, p.description, p.unit, p.created_at, 
          COALESCE(im.total_quantity, 0) total_quantity
        FROM products p
          LEFT OUTER JOIN 
            (
              SELECT product_id, SUM(quantity) total_quantity FROM inventory_movements im
                GROUP BY product_id
            ) im ON p.id = im.product_id
            WHERE TRUE
            ${ id != null ? `AND p.id = '${id}'` : ''}
            ${ name != null ? `AND LOWER(p.name) LIKE '%${name.toLowerCase()}%'` : ''}
            ${ status === 'true' ? `AND p.deactivated_date IS NULL` : '' }
            ${ status === 'false' ? `AND p.deactivated_date IS NOT NULL` : '' }
          ORDER BY (total_quantity - p.min_inventory_level) DESC
      `,
      { 
        bind: [],
        type: sequelize.QueryTypes.SELECT 
      }
    );

    res.send(results);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

router.post('/', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) { 

  const {name, description, unit, min_inventory_level } = req.body;
    
  try {
    assertNotNull(req.body, ['name', 'min_inventory_level'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }
  
  try {
    const newProduct = await Product.create({ name, description, unit, min_inventory_level });

    // Add product to Guest supplier's menu
    await SupplierMenu.create({ supplier_id: GUEST_ID, product_id: newProduct.id });
    
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.INVENTORY.id,
      text: `${user.name} created a product record for ${name}`, 
    });

    res.send(newProduct.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


router.put('/', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
  const { id, name, description, unit, min_inventory_level } = req.body;

  try {
    assertNotNull(req.body, ['id', 'name', 'min_inventory_level'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await Product.update(
      { name, description, unit, min_inventory_level },
      { where: { id: id } }
    );

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Product id ${id} not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.INVENTORY.id,
        text: `${user.name} updated ${name}'s product record`, 
      });

      res.send({ id: id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


router.post('/deactivate', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
  }

  try {
    const product = await Product.findByPk(id);

    if (product == null) {
      res.status(400).send(`Product id ${id} not found.`)

    } else {
      product.deactivated_date = new Date();
      product.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CRM.id,
          text: `${user.name} deactivated product ${product.name}`, 
      });

      res.send({ id: product.id, deactivated_date: product.deactivated_date });
    }

  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


router.post('/deactivate', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
  }

  try {
    const product = await Product.findByPk(id);

    if (product == null) {
      res.status(400).send(`Product id ${id} not found.`)

    } else {
      product.deactivated_date = new Date();
      product.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CRM.id,
          text: `${user.name} deactivated product ${product.name}`, 
      });

      res.send({ id: product.id, deactivated_date: product.deactivated_date });
    }

  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


router.post('/activate', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const product = await Product.findByPk(id);

    if (product == null) {
      res.status(400).send(`Product id ${id} not found.`)

    } else {
      product.deactivated_date = null;
      product.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} activated product ${product.name}`, 
      });

      res.send({ id: product.id, deactivated_date: null });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.get('/latestPrice', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { id } = req.query;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }
  
  try {
    // Select only where PO status ACCEPTED/SENT/CLOSED
    const results = await sequelize.query(
      `
        SELECT po.created_at, po.id, po.supplier_id, s.company_name, poi.unit_cost
        FROM purchase_order_items poi
          LEFT JOIN purchase_orders po ON po.id = poi.purchase_order_id
          LEFT JOIN suppliers s ON po.supplier_id = s.id
          WHERE poi.product_id = $1
          AND po.purchase_order_status_id IN (2,3,5)
          ORDER BY po.created_at DESC
      `,
      { 
        bind: [id],
        type: sequelize.QueryTypes.SELECT 
      }
    );

    const supplierMap = {}
    for (let row of results) {
      if (!supplierMap[row.supplier_id]) {
        supplierMap[row.supplier_id] = row;
      }
    }

    const transformed = Object.keys(supplierMap).map(key => supplierMap[key]);

    res.send(transformed);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.get('/inventoryMovement', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { product_id } = req.query;
  
  if (product_id == null) {
    res.status(400).send("'product_id' is required.", )
    return;
  }
  
  try {
    const results = await InventoryMovement.findAll({ where: { product_id: product_id },
      include: [
        { model: PurchaseOrderItem, include: [{ model: PurchaseOrder, include: [Supplier]}] }, 
        { model: SalesOrderItem, include: [{ model: SalesOrder, include: [Customer]}] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.send(results);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;