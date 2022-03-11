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


router.get('/', requireAccess(ViewType.DISPATCH, false), async function(req, res, next) {
    const { employee_name, start_date, end_date, session } = req.query;

    const where = {};
    const incEmployee = { model: Employee };

    if (employee_name != null) {
        incEmployee.where = { name: { [Sequelize.Op.iLike]: `%${employee_name}%` } };
    }
    if (session != null) {
        where.session = session;
    }
    if (start_date != null && end_date != null) {
        where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };
    }
    
    try {
        const itinerarys = await Itinerary.findAll({ where: where, include: [incEmployee], order: [['created_at', 'DESC']]});

        const fullItinerarys = await Promise.all(itinerarys.map(async itinerary => ({
            ...itinerary.toJSON(),
            delivery_orders: await DeliveryOrder.findAll({ where: { itinerary_id: itinerary.id } }),
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
        assertNotNull(req.body, ['start_time', 'session', 'origin_postal_code', 'longitude', 'latitude', 'driver_id', 'delivery_orders']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const newItinerary = await Itinerary.create(req.body);

        for (let order of delivery_orders) {
            await DeliveryOrder.update({ 
                itinerary_id: newItinerary.id, 
                sequence: order.sequence, 
                delivery_status_id: DeliveryStatusEnum.ASSIGNED.id 
            }, 
            { 
                where: { id: order.id } 
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

module.exports = router;
