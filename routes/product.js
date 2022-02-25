var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Product } = require('../models/Product');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { SupplierMenu, GUEST_ID } = require('../models/Supplier');


router.get('/', requireAccess(ViewType.INVENTORY, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
    const products = await Product.findAll(predicate);
    res.send(products);
    
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


module.exports = router;