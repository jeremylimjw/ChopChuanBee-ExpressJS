var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { Customer, ChargedUnder } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');

/**
 * Customer route
 * All routes here will be trailed with /api/customer, configured in routes/index.js
 */


/**
 *  GET method: View all customers or a single customer if id is given
 *  - e.g. /api/customer OR /api/customer?id=123
 *  - requireAccess(ViewType.CRM, false) because this is only reading data
 * */ 
router.get('/', requireAccess(ViewType.CRM, false), async function(req, res, next) {
  const { id } = req.query; // This is same as `const id = req.params.id`;
  
  try {
    if (id != null) { // Retrieve single customer
      const customer = await Customer.findOne({ where: { id: id }, include: ChargedUnder });
  
      if (customer == null) {
        res.status(400).send(`Customer id ${id} not found.`);
        return;
      }
      
      res.send(customer.toJSON());
  
    } else { // Retrieve ALL customers
      const customers = await Customer.findAll({ include: ChargedUnder});
      
      res.send(customers);
    }
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

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (company_name == null || p1_name == null 
      || p1_phone_number == null || address == null 
      || postal_code == null || charged_under_id == null 
      || gst == null || gst_show == null) {
    res.status(400).send("'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show' are required.", )
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

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (id == null || company_name == null 
      || p1_name == null || p1_phone_number == null 
      || address == null || postal_code == null 
      || charged_under_id == null || gst == null || gst_show == null) {
    res.status(400).send("'id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'charged_under_id', 'gst', 'gst_show' are required.", )
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


/**
 *  DELETE method: Update a customer 'deleted' attribute
 *  - /api/customer
 *  - requireAccess(ViewType.CRM, true) because this is writing data
 * */ 
router.delete('/', requireAccess(ViewType.CRM, true), async function(req, res, next) {
  const { id } = req.query;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const customer = await Customer.findByPk(id);

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (customer == null) {
      res.status(400).send(`Customer id ${id} not found.`)

    } else {
      customer.deleted = true;
      customer.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} deleted ${customer.company_name}'s customer record`, 
      });

      res.send({ id: customer.id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
