var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { ChargedUnder } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');


/**
 *  GET method: Get customers
 * */ 
router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
    const chargedUnders = await ChargedUnder.findAll(predicate);
    res.send(chargedUnders);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

// POST and PUT admin only

module.exports = router;
