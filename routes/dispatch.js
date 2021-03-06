var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');
const { DeliveryOrder } = require('../models/DeliveryOrder');
const { Itinerary } = require('../models/Itinerary');
const DeliveryStatusEnum = require('../common/DeliveryStatusEnum');
const { Employee } = require('../models/Employee');
const { SalesOrder, SalesOrderItem } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');
const { Product } = require('../models/Product');


/**
 * FOR MOBILE APP use cases
 * These routes only requires to be logged in as they are for mobile app drivers
 */

router.get('/itinerary', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { employee_id } = req.query;

    const where = {};
    const incEmployee = { model: Employee, where: {} };

    if (employee_id != null) {
        incEmployee.where.id = employee_id;
    }
    
    try {
        const itinerarys = await Itinerary.findAll({ where: where, include: [incEmployee], order: [['start_time', 'DESC']]});

        const fullItinerarys = await Promise.all(itinerarys.map(async itinerary => ({
            ...itinerary.toJSON(),
            delivery_orders: await DeliveryOrder.findAll({ 
                where: { itinerary_id: itinerary.id }, 
                order: [['sequence', 'ASC']], 
                include: [{ model: SalesOrder, include: [{ model: SalesOrderItem, include: [Product] }, Customer]}] 
            }),
        })));

        res.send(fullItinerarys);

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/deliveryOrder/complete', requireAccess(ViewType.GENERAL), async function(req, res, next) {
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

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} completed a delivery order with ID ${id}`, 
        });

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/deliveryOrder/unassign', requireAccess(ViewType.GENERAL), async function(req, res, next) {
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

        if (deliveryOrder.delivery_status_id === DeliveryStatusEnum.PENDING.id) {
            res.status(400).send('Delivery order already unassigned!');
            return;
        }
        
        deliveryOrder.itinerary_id = null;
        deliveryOrder.sequence = -1;
        deliveryOrder.delivery_status_id = DeliveryStatusEnum.PENDING.id;
        
        await deliveryOrder.save();

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} unassigned a delivery order with ID ${id}`, 
        });

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/deliveryOrder/signature', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { id, signature } = req.body;

    // Validation
    try {
        assertNotNull(req.body, ['id', 'signature']);

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
        
        deliveryOrder.signature = signature;
        await deliveryOrder.save();

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} recorded signature for a delivery order with ID ${id}`, 
        });

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;