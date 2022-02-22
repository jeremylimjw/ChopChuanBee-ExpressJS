var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');


router.get('/', requireAccess(ViewType.ADMIN, false), async function(req, res, next) {
    const predicate = parseRequest(req.query);
  
    try {
        const logs = await Log.findAll(predicate);
        res.send(logs);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;