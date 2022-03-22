var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { Customer, CustomerMenu, ChargedUnder } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Product } = require('../models/Product');
const { sequelize } = require('../db');

/**
 * Customer route
 * All routes here will be trailed with /api/customer, configured in routes/index.js
 */


/**
 *  GET method: Get customers
 *  - requireAccess(ViewType.CRM, false) because this is only reading data
 * */ 
router.get('/', requireAccess(ViewType.CRM, false), async function(req, res, next) {
  const { id, company_name, p1_name, status } = req.query;
  
  try {
    const results = await sequelize.query(
      `
      SELECT *, COALESCE(sq.ar, 0) ar FROM customers c
        LEFT OUTER JOIN 
        (
          SELECT so.customer_id, SUM(amount) ar FROM payments p
          LEFT JOIN sales_orders so ON so.id = p.sales_order_id
          AND so.payment_term_id = 2
          AND so.sales_order_status_id IN (2,3,5)
          GROUP BY so.customer_id
        ) sq ON sq.customer_id = c.id
        WHERE TRUE 
        ${id ? `AND c.id = '${id}'` : ''}
        ${ company_name != null ? `AND LOWER(c.company_name) LIKE '%${company_name.toLowerCase()}%'` : ''}
        ${ p1_name != null ? `AND LOWER(c.p1_name) LIKE '%${p1_name.toLowerCase()}%'` : ''}
        ${ status === 'true' ? `AND c.deactivated_date IS NULL` : '' }
        ${ status === 'false' ? `AND c.deactivated_date IS NOT NULL` : '' }
        ORDER BY c.created_at DESC
      `,
      { 
        bind: [],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    const joinedResults = [];
    for (let customer of results) {
      const cu = await ChargedUnder.findByPk(customer.charged_under_id);
      joinedResults.push({...customer, charged_under: cu });
    }

    res.send(joinedResults);
    
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
  const { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst_show, description } = req.body;
  
  try {
    assertNotNull(req.body, ['company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newCustomer = await Customer.create({ company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst_show, description });
    
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
  const { id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst_show, description } = req.body;

  try {
    assertNotNull(req.body, ['id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await Customer.update(
      { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, charged_under_id, gst_show, description },
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
          text: `${user.name} deactivated ${customer.company_name}'s record`, 
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
        view_id: ViewType.CRM.id,
        text: `${user.name} activated ${customer.company_name}'s record`, 
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
    
    res.send({ id: customer_id });

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

router.get('/latestPrice', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { customer_id } = req.query;

  if (customer_id == null) {
    res.status(400).send("'customer_id' is required.");
    return;
  }
  
  try {
    const results = await sequelize.query(
      `
        SELECT DISTINCT ON (soi.product_id) 
        soi.product_id, soi.unit_price
          FROM sales_order_items soi
          LEFT JOIN sales_orders so ON so.id = soi.sales_order_id
          WHERE so.sales_order_status_id IN (2,3,5)
          AND so.customer_id = '${customer_id}'
          ORDER BY soi.product_id, soi.created_at DESC
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


module.exports = router;
