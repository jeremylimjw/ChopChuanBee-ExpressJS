var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * Customer route
 * All routes here will be trailed with /api/customer, configured in routes/index.js
 */


/**
 *  GET method: View all customers or a single customer if id is given
 *  - e.g. /api/customer OR /api/customer?id=123
 *  - requireAccess("CRM", false) because this is only reading data
 * */ 
router.get('/', requireAccess("CRM", false), async function(req, res, next) {
  const { id } = req.params; // This is same as `const id = req.params.id`;
  
  if (id != null) { // Retrieve single customer
    const { rows } = await db.query(`
      SELECT 
        cus_id, company_name, company_email, p1_name, p1_phone_number, 
        p2_name, p2_phone_number, address, postal_code, cu_name, 
        gst, gst_show, description, created_at 
        
        FROM customers LEFT JOIN charged_under_enum USING (cu_id)
        WHERE cus_id = $1`, [id]
    );
    res.send(rows);

  } else { // Retrieve ALL customers
    const { rows } = await db.query(`
      SELECT 
        cus_id, company_name, company_email, p1_name, p1_phone_number, 
        p2_name, p2_phone_number, address, postal_code, cu_name, 
        gst, gst_show, description, created_at 
        
        FROM customers LEFT JOIN charged_under_enum USING (cu_id)
    `);
    res.send(rows);
  }

});


/**
 *  POST method: Insert a customer given the data in the HTTP body
 *  - /api/customer
 *  - requireAccess("CRM", true) because this is writing data
 * */ 
router.post('/', requireAccess("CRM", true), async function(req, res, next) {
  const { company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, cu_id, gst, gst_show, description } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (company_name == null || p1_name == null 
      || p1_phone_number == null || address == null 
      || postal_code == null || cu_id == null 
      || gst == null || gst_show == null) {
    res.status(400).send("'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'cu_id', 'gst', 'gst_show' are required.", )
    return;
  }

  try {
    const id = uuidv4(); // Use this to generate random id

    await db.query(`
      INSERT INTO customers 
        (cus_id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, cu_id, gst, gst_show, description) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, 
        [id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, cu_id, gst, gst_show, description]
    );

    res.send({ id: id });

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


/**
 *  PUT method: Update a customer given the data in the HTTP body
 *  - /api/customer
 *  - requireAccess("CRM", true) because this is writing data
 * */ 
router.put('/', requireAccess("CRM", true), async function(req, res, next) {
  const { cus_id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, cu_id, gst, gst_show, description } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (cus_id == null || company_name == null 
      || p1_name == null || p1_phone_number == null 
      || address == null || postal_code == null 
      || cu_id == null || gst == null || gst_show == null) {
    res.status(400).send("'cus_id', 'company_name', 'p1_name', 'p1_phone_number', 'address', 'postal_code', 'cu_id', 'gst', 'gst_show' are required.", )
    return;
  }

  try {
    const { rows } = await db.query(`
      UPDATE customers 
        SET 
          company_name = $2, company_email = $3, 
          p1_name = $4, p1_phone_number = $5, 
          p2_name = $6, p2_phone_number = $7, 
          address = $8, postal_code = $9, 
          cu_id = $10, gst = $11, 
          gst_show = $12, description = $13
        WHERE cus_id = $1
        RETURNING cus_id`, // this returns cus_id if customer record is found, else it returns empty array
        [cus_id, company_name, company_email, p1_name, p1_phone_number, p2_name, p2_phone_number, address, postal_code, cu_id, gst, gst_show, description]
    );

    // If 'cus_id' is not found return 400 Bad Request, if found then return the 'cus_id'
    if (rows.length === 0) {
      res.status(400).send(`'cus_id': ${cus_id} is not found.`)
    } else {
      res.send(rows[0]);
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
 *  - requireAccess("CRM", true) because this is writing data
 * */ 
router.delete('/', requireAccess("CRM", true), async function(req, res, next) {
  const { cus_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (cus_id == null) {
    res.status(400).send("'cus_id' is required.", )
    return;
  }

  try {
    const { rows } = await db.query(`
      UPDATE customers 
        SET 
          deleted = TRUE
        WHERE cus_id = $1
        RETURNING cus_id`, // this returns cus_id if customer record is found, else it returns empty array
        [cus_id]
    );

    // If 'cus_id' is not found return 400 Bad Request, if found then return the 'cus_id'
    if (rows.length === 0) {
      res.status(400).send(`'cus_id': ${cus_id} is not found.`)
    } else {
      res.send(rows[0]);
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
