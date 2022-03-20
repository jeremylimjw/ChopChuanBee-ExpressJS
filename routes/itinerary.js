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
const { SalesOrder } = require('../models/SalesOrder');
const { Customer } = require('../models/Customer');


router.get('/', requireAccess(ViewType.DISPATCH, false), async function(req, res, next) {
    const { id, employee_name, start_date, end_date } = req.query;

    const where = {};
    const incEmployee = { model: Employee };

    if (id != null) {
        where.id = id;
    }
    if (employee_name != null) {
        incEmployee.where = { name: { [Sequelize.Op.iLike]: `%${employee_name}%` } };
    }
    if (start_date != null && end_date != null) {
        where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };
    }
    
    try {
        const itinerarys = await Itinerary.findAll({ where: where, include: [incEmployee], order: [['created_at', 'DESC']]});

        const fullItinerarys = await Promise.all(itinerarys.map(async itinerary => ({
            ...itinerary.toJSON(),
            delivery_orders: await DeliveryOrder.findAll({ where: { itinerary_id: itinerary.id }, order: [['sequence', 'ASC']], include: [{ model: SalesOrder, include: [Customer]}] }),
        })));

        res.send(fullItinerarys);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/', requireAccess(ViewType.DISPATCH, true), async function(req, res, next) {
    const { driver_id, delivery_orders } = req.body;

    // Validation
    try {
        assertNotNull(req.body, ['start_time', 'origin_postal_code', 'longitude', 'latitude', 'driver_id', 'delivery_orders']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const newItinerary = await Itinerary.create(req.body);

        for (let i = 0; i < delivery_orders.length; i++) {
            await DeliveryOrder.update({ 
                itinerary_id: newItinerary.id, 
                sequence: i, 
                delivery_status_id: DeliveryStatusEnum.ASSIGNED.id 
            }, 
            { 
                where: { id: delivery_orders[i].id } 
            })
        }
        
        // Record to admin logs
        const user = res.locals.user;
        const driver = await Employee.findByPk(driver_id);
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} created an itinerary for ${driver.name}`, 
        });

        res.send(newItinerary);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.put('/', requireAccess(ViewType.DISPATCH, true), async function(req, res, next) {
    const { id, delivery_orders, driver_id } = req.body;

    // Validation
    try {
        assertNotNull(req.body, ['id', 'start_time', 'origin_postal_code', 'longitude', 'latitude', 'driver_id', 'delivery_orders']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        // Update itinerary fields
        await Itinerary.update(req.body, { where: { id: id }});
        
        // Unassign all previous DOs
        await DeliveryOrder.update({ 
            itinerary_id: null, 
            sequence: -1, 
            delivery_status_id: DeliveryStatusEnum.PENDING.id 
        }, {
            where: { itinerary_id: id }
        })

        // Re-assign all new DOs
        for (let i = 0; i < delivery_orders.length; i++) {
            await DeliveryOrder.update({ 
                itinerary_id: id, 
                sequence: i, 
                delivery_status_id: DeliveryStatusEnum.ASSIGNED.id 
            }, 
            { 
                where: { id: delivery_orders[i].id } 
            })
        }
        
        // Record to admin logs
        const user = res.locals.user;
        const driver = await Employee.findByPk(driver_id);
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} edited an itinerary for ${driver.name}`, 
        });

        res.send({ id: id });
        
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
        const itinerary = await Itinerary.findByPk(id, { include: [Employee] });

        // Unassign all previous DOs
        await DeliveryOrder.update({ 
            itinerary_id: null, 
            sequence: -1, 
            delivery_status_id: DeliveryStatusEnum.PENDING.id 
        }, {
            where: { itinerary_id: id }
        })
        
        // Delete itinerary
        await Itinerary.destroy({ where: { id: id }});
        
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.DISPATCH.id,
            text: `${user.name} deleted an itinerary for ${itinerary.employee.name}`, 
        });

        res.send({ id: id });
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;
