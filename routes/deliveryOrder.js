var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { DeliveryOrder } = require('../models/DeliveryOrder');


router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
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