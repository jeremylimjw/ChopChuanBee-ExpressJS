var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');
const { DeliveryOrder, generateAndSaveQRCode } = require('../models/DeliveryOrder');
const { SalesOrder, getGeocode } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');
const { sequelize } = require('../db');
const DeliveryStatusEnum = require('../common/DeliveryStatusEnum');


router.get('/', requireAccess(ViewType.DISPATCH, false), async function(req, res, next) {
    const { id, customer_company_name, customer_p1_name, delivery_status_id } = req.query;
    
    try {
        const results = await sequelize.query(
            `
            SELECT 
                d.id, d.address, d.postal_code, d.longitude, d.latitude, d.deliver_at, d.remarks, d.qr_code, d.created_at, d.sales_order_id, d.delivery_status_id, d.itinerary_id, d.signature,
                c.id AS customer_id, c.company_name AS customer_company_name, c.p1_name AS customer_p1_name, c.p1_phone_number AS customer_phone_number, c.company_email AS customer_email
            FROM delivery_orders d
            LEFT JOIN sales_orders so ON so.id = d.sales_order_id
            LEFT JOIN customers c ON so.customer_id = c.id
                WHERE TRUE
                ${id ? `AND d.id = ${id}` : ""}
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


router.post('/', requireAccess(ViewType.DISPATCH, true), async function(req, res, next) {
    const { address, postal_code, remarks } = req.body;

    // Validation
    let geoCoords;
    try {
        assertNotNull(req.body, ['address', 'postal_code']);

        geoCoords = await getGeocode(postal_code);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const deliveryOrder = {
          delivery_status_id: DeliveryStatusEnum.PENDING.id,
          address: address,
          postal_code: postal_code,
          remarks: remarks,
          longitude: geoCoords.longitude,
          latitude: geoCoords.latitude,
        }

        const newDeliveryOrder = await DeliveryOrder.create(deliveryOrder);

        // Create QR Code
        await generateAndSaveQRCode(newDeliveryOrder);

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} created a custom delivery order for address ${address}`, 
        });

        res.send(newDeliveryOrder);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.put('/', requireAccess(ViewType.DISPATCH, true), async function(req, res, next) {
    const deliveryOrder = req.body;

    let geoCoordinates;
    // Validation
    try {
        assertNotNull(deliveryOrder, ['id', 'address', 'postal_code', 'delivery_status_id']);

        geoCoordinates = await getGeocode(deliveryOrder.postal_code);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        // If setting to PENDING, unassign any attached driver
        if (deliveryOrder.delivery_status_id === DeliveryStatusEnum.PENDING.id) {
            deliveryOrder.itinerary_id = null;
        }

        // If setting to COMPLETED, record timestamp
        if (deliveryOrder.delivery_status_id === DeliveryStatusEnum.COMPLETED.id && deliveryOrder.deliver_at == null) {
            deliveryOrder.deliver_at = new Date();
        }

        const newDeliveryOrder = {...deliveryOrder, ...geoCoordinates };
        
        await DeliveryOrder.update(newDeliveryOrder, { where: { id: deliveryOrder.id }});
        
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} edited a delivery order with ID ${newDeliveryOrder.id}`, 
        });

        res.send(newDeliveryOrder);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.delete('/', requireAccess(ViewType.DISPATCH, true), async function(req, res, next) {
    const { id } = req.query;
    
    // Validation
    try {
        assertNotNull(req.query, ['id']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        await DeliveryOrder.destroy({ where: { id: id }});
        
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} deleted a custom delivery order with ID ${id}`, 
        });

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


// For Scan QR code to complete delivery use case
router.post('/complete', async function(req, res, next) {
    const { id } = req.body;

    // Validation
    try {
        assertNotNull(req.body, ['id']);

        if (id.length !== 36) {
            res.status(400).send('Invalid delivery order ID!');
            return;
        }
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const deliveryOrder = await DeliveryOrder.findByPk(id);

        if (deliveryOrder == null) {
            res.status(400).send('Invalid delivery order ID!');
            return;
        }

        if (deliveryOrder.delivery_status_id === DeliveryStatusEnum.COMPLETED.id) {
            res.status(400).send('Delivery order already completed!');
            return;
        }

        deliveryOrder.delivery_status_id = DeliveryStatusEnum.COMPLETED.id;
        deliveryOrder.deliver_at = new Date();
        
        await deliveryOrder.save();

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;
