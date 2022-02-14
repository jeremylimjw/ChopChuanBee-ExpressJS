var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
<<<<<<< HEAD
const { Supplier, SupplierMenu } = require('../models/Supplier');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Product } = require('../models/Product');

//Read supplier (find 1 or find all depending if ID was given)
=======
const Supplier = require('../models/Supplier');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');


>>>>>>> master
router.get('/', requireAccess(ViewType.SCM, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
    const suppliers = await Supplier.findAll(predicate);
    res.send(suppliers);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

router.post('/', requireAccess(ViewType.SCM, true), async function(req, res, next) { 

    const { company_name, s1_name, s1_phone_number, address, postal_code, description, company_email, s2_name, s2_phone_number} = req.body;

<<<<<<< HEAD
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (company_name == null || s1_name == null 
        || s1_phone_number == null || address == null 
        || postal_code == null ) {
      res.status(400).send("'company_name', 's1_name', 's1_phone_number', 'address', 'postal_code' are required.", )
=======
    try {
      assertNotNull(req.body, ['company_name', 's1_name', 's1_phone_number', 'address', 'postal_code'])
    } catch(err) {
      res.status(400).send(err);
>>>>>>> master
      return;
    }
  
    try {
      const newSupplier = await Supplier.create({ company_name,s1_name, s1_phone_number, address, postal_code, description, company_email, s2_name, s2_phone_number});
      
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.SCM.id,
        text: `${user.name} created a supplier record for ${company_name}`, 
      });
  
      res.send(newSupplier.toJSON());
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


/**
 *  PUT method: Update a supplier given the data in the HTTP body
 *  - /api/supplier
 *  - requireAccess(ViewType.CRM, true) because this is writing data
 * */ 
 router.put('/', requireAccess(ViewType.SCM, true), async function(req, res, next) {
    const { id, company_name,s1_name, s1_phone_number, address, postal_code, description, company_email,s2_name, s2_phone_number} = req.body;
  
    try {
      assertNotNull(req.body, ['id', 'company_name', 's1_name', 's1_phone_number', 'address', 'postal_code'])
    } catch(err) {
      res.status(400).send(err);
      return;
    }
  
    try {
      const result = await Supplier.update(
        { id, company_name,s1_name, s1_phone_number, address, postal_code, description, company_email,s2_name, s2_phone_number},
        { where: { id: id } }
      );
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (result[0] === 0) {
        res.status(400).send(`Supplier id ${id} not found.`)
  
      } else {
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.SCM.id,
          text: `${user.name} updated ${company_name}'s supplier record`, 
        });
  
        res.send({ id: id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });
  
/**
 *  DELETE method: Update a supplier 'deleted' attribute
 *  - /api/supplier
 *  - requireAccess(ViewType.CRM, true) because this is writing data
 * */ 
router.delete('/', requireAccess(ViewType.SCM, true), async function(req, res, next) {
    const { id } = req.query;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
    }
  
    try {
      const supplier = await Supplier.findByPk(id);
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (supplier == null) {
        res.status(400).send(`Supplier id ${id} not found.`)
  
      } else {
        supplier.deleted = true;
        supplier.save();
  
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.SCM.id,
          text: `${user.name} deleted ${supplier.company_name}'s supplier record`, 
        });
  
        res.send({ id: id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});


router.get('/menu', requireAccess(ViewType.SCM, false), async function(req, res, next) {
  // This is a dynamic query where user can search using any column
  const predicate = parseRequest(req.query);

  try {
    predicate.include = [Product];
    const supplierMenu = await SupplierMenu.findAll(predicate);
    res.send(supplierMenu);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/menu', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { supplier_menu_items } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['supplier_menu_items']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newSupplierMenus = await SupplierMenu.bulkCreate(supplier_menu_items);
    res.send(newSupplierMenus);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.delete('/menu', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { supplier_id, product_id } = req.query;

  // Validation here
  try {
    assertNotNull(req.query, ['supplier_id', 'product_id']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    await SupplierMenu.destroy({ where: { supplier_id, product_id } });
    res.send({ id: supplier_id });

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

  
module.exports = router;