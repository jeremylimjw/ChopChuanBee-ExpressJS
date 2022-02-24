var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Supplier, SupplierMenu } = require('../models/Supplier');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Product } = require('../models/Product');

//Read supplier (find 1 or find all depending if ID was given)
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

  try {
    assertNotNull(req.body, ['company_name', 's1_name', 's1_phone_number', 'address', 'postal_code'])
  } catch(err) {
    res.status(400).send(err);
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


router.post('/deactivate', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
  }

  try {
    const supplier = await Supplier.findByPk(id);

    if (supplier == null) {
    res.status(400).send(`Supplier id ${id} not found.`)

    } else {
    supplier.deactivated_date = new Date();
    supplier.save();

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.SCM.id,
        text: `${user.name} deactivated ${supplier.name}'s record`, 
    });

    res.send({ id: supplier.id, deactivated_date: supplier.deactivated_date });
  }


  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


router.post('/activate', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const supplier = await Supplier.findByPk(id);

    if (supplier == null) {
      res.status(400).send(`Supplier id ${id} not found.`)

    } else {
      supplier.deactivated_date = null;
      supplier.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.SCM.id,
        text: `${user.name} activated ${supplier.name}'s record`, 
      });

      res.send({ id: supplier.id, deactivated_date: null });
    }

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.get('/menu', requireAccess(ViewType.SCM, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);

  try {
    predicate.include = [Product];
    predicate.order = [[Product, 'name']];
    const supplierMenu = await SupplierMenu.findAll(predicate);
    res.send(supplierMenu);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


router.put('/menu', requireAccess(ViewType.SCM, true), async function(req, res, next) {
  const { supplier_id, supplier_menus } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['supplier_id', 'supplier_menus']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    await SupplierMenu.destroy({ where: { supplier_id }})
    await SupplierMenu.bulkCreate(supplier_menus);
    
    res.send({ id: supplier_id });

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

  
module.exports = router;