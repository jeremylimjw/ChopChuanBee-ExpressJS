var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Product, ProductCategory } = require('../models/Product');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');


router.get('/', requireAccess(ViewType.INVENTORY, false), async function(req, res, next) {
    const { id } = req.query; // This is same as `const id = req.params.id`;
  
    try {
      if (id != null) { // Retrieve single product
        const product = await Product.findOne({ where: { id: id }, include: ProductCategory });
    
        if (product == null) {
          res.status(400).send(`product id ${id} not found.`);
          return;
        }
        
        res.send(product.toJSON());
    
      } else { // Retrieve ALL products
        const products = await Product.findAll({ include: ProductCategory });
        
        res.send(products);
      }
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

router.post('/', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) { 

    const {name, description, unit, min_inventory_level, product_category_id } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (name == null || unit == null 
        || min_inventory_level == null || product_category_id == null) {
      res.status(400).send("'name', 'unit', 'min_inventory_level', 'product_category_id' are required.", )
      return;
    }
  
    try {
      const newProduct = await Product.create({name, description, unit, min_inventory_level, product_category_id});
      
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.INVENTORY.id,
        text: `${user.name} created a product record for ${name}`, 
      });
  
      res.send({ id: newProduct.id });
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


router.put('/', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
    const { id, name, description, unit, min_inventory_level, product_category_id } = req.body;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null || name == null 
        || unit == null || min_inventory_level == null || product_category_id == null) {
      res.status(400).send("'id', 'name' , 'unit', min_inventory_level', 'product_category_id' are required.", )
      return;
    }
  
    try {
      const result = await Product.update(
        { name, description, unit, min_inventory_level, product_category_id },
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
  
        res.send(id);
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });
  router.delete('/', requireAccess(ViewType.INVENTORY, true), async function(req, res, next) {
    const { id } = req.body;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
    }
  
    try {
      const product = await Product.findByPk(id);
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (product == null) {
        res.status(400).send(`Product id ${id} not found.`)
  
      } else {
        product.deleted = true;
        product.save();
  
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.INVENTORY.id,
          text: `${user.name} deleted ${product.name}'s product record`, 
        });
  
        res.send(id);
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });


module.exports = router;