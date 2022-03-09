var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');
const { DeliveryOrder } = require('../models/DeliveryOrder');


router.get('/', requireAccess(ViewType.DISPATCH, false), async function(req, res, next) {
    const predicate = parseRequest(req.query);
    
    try {
        const results = await DeliveryOrder.findAll(predicate);
        res.send(results);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;
