var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');
const { DeliveryOrder } = require('../models/DeliveryOrder');
const { SalesOrder } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');
const { sequelize } = require('../db');


router.get('/', requireAccess(ViewType.DISPATCH, false), async function(req, res, next) {
    const { customer_company_name, customer_p1_name, delivery_status_id } = req.query;
    
    try {
        const results = await sequelize.query(
            `
            SELECT 
                d.id, d.address, d.postal_code, d.longitude, d.latitude, d.deliver_at, d.remarks, d.qr_code, d.created_at, d.sales_order_id, d.delivery_status_id, d.itinerary_id,
                c.id AS customer_id, c.company_name AS customer_company_name, c.p1_name AS customer_p1_name, c.p1_phone_number AS customer_phone_number, c.company_email AS customer_email
            FROM delivery_orders d
            LEFT JOIN sales_orders so ON so.id = d.sales_order_id
            LEFT JOIN customers c ON so.customer_id = c.id
                WHERE TRUE
                ${delivery_status_id ? `AND d.delivery_status_id = ${delivery_status_id}` : ""}
                ${customer_company_name ? `AND LOWER(c.company_name) LIKE '%${customer_company_name.toLowerCase()}%'` : ""}
                ${customer_p1_name ? `AND LOWER(c.p1_name) LIKE '%${customer_p1_name.toLowerCase()}%'` : ""}
            ORDER BY d.created_at DESC
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
