var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { Customer, CustomerMenu } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Product } = require('../models/Product');

/**
 * Customer route
 * All routes here will be trailed with /api/customer, configured in routes/index.js
 */


/**
 *  GET method: Get customers
 *  - e.g. /api/customer OR /api/customer?id=123
 *  - requireAccess(ViewType.CRM, false) because this is only reading data
 * */ 
router.get('/', requireAccess(ViewType.CRM, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
    const customers = await Customer.findAll(predicate);
    res.send(customers);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


/**
 *  POST method: Insert a customer given the data in the HTTP body
 *  - /api/customer
 *  - requireAccess(ViewType.CRM, true) because this is writing data
 * */ 
router.post('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description } = req.body;
  
  try {
    assertNotNull(req.body, ['company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newCustomer = await Customer.create({ company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description });
    
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.CRM.id,
      text: `${user.name} created a customer record for ${company_name}`, 
    });

    res.send(newCustomer.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


/**
 *  PUT method: Update a customer given the data in the HTTP body
 *  - /api/customer
 *  - requireAccess(ViewType.CRM, true) because this is writing data
 * */ 
router.put('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description } = req.body;

  try {
    assertNotNull(req.body, ['id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await Customer.update(
      { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst, gst_show, description },
      { where: { id: id } }
    );

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Customer id ${id} not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} updated ${company_name}'s customer record`, 
      });

      res.send({ id: id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/deactivate', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
  }

  try {
    const customer = await Customer.findByPk(id);

    if (customer == null) {
      res.status(400).send(`Customer id ${id} not found.`)

    } else {
      customer.deactivated_date = new Date();
      customer.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CRM.id,
          text: `${user.name} deactivated ${customer.name}'s record`, 
      });

      res.send({ id: customer.id, deactivated_date: customer.deactivated_date });
    }

  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


router.post('/activate', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const customer = await Customer.findByPk(id);

    if (customer == null) {
      res.status(400).send(`Customer id ${id} not found.`)

    } else {
      customer.deactivated_date = null;
      customer.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} activated ${customer.name}'s record`, 
      });

      res.send({ id: customer.id, deactivated_date: null });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.get('/menu', requireAccess(ViewType.CRM, false), async function(req, res, next) {
  const predicate = parseRequest(req.query);

  try {
    const customerMenu = await CustomerMenu.findAll(predicate);
    res.send(customerMenu);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

router.put('/menu', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { customer_id, customer_menus } = req.body;

  // Validation here
  try {
    assertNotNull(req.body, ['customer_id', 'customer_menus']);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    await CustomerMenu.destroy({ where: { customer_id }})
    await CustomerMenu.bulkCreate(customer_menus);
    const newItems = await CustomerMenu.findAll({ where: { customer_id }, include: [Product], order: ['product_alias'] });
    res.send(newItems);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
