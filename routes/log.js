var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Employee } = require('../models/Employee');
const Sequelize = require('sequelize');


router.get('/', requireAccess(ViewType.ADMIN, false), async function(req, res, next) {
    const { name } = req.query;
    delete req.query.name;
    const predicate = parseRequest(req.query);
  
    try {
        predicate.include = [{ model: Employee, where: { name: { [Sequelize.Op.iLike]: `%${name || ''}%` }}}];
        
        const suppliers = await Log.findAll(predicate);
        res.send(suppliers);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;