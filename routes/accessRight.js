var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { insertAccessRights, validateAccessRights, removeAccessRights, validateRemoveAccessRights } = require('../models/AccessRight');
const { Employee } = require('../models/Employee');
const Log = require('../models/Log');


/**
 *  POST method: Give access right to an employee
 *  - /api/employee/grant
 *  - requireAccess(ViewType.ADMIN, true)
 * */ 
 router.post('/grant', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
    const { employee_id, access_rights } = req.body;

    // Validation
    if (employee_id == null || access_rights == null || !Array.isArray(access_rights)) {
        res.status(400).send("'employee_id' is required and 'access_rights' must be an array", )
        return;
    }
    
    // Validation
    try {
        validateAccessRights(access_rights);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        // Find the employee using `employee_id`
        const employee = await Employee.findOne({ where: { id: employee_id } });
        if (employee == null) {
            res.status(400).send(`Employee id ${employee_id} not found.`);
            return;
        }
        
        const user = res.locals.user;
        await insertAccessRights(access_rights, employee, user);

        res.send({ id: employee.id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


/**
 *  DELETE method: Remove access right to an employee
 *  - /api/employee/revoke
 *  - requireAccess(ViewType.ADMIN, true)
 * */ 
router.post('/revoke', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
    const { employee_id, access_rights } = req.body;

    // Validation
    if (employee_id == null || access_rights == null) {
        res.status(400).send("'employee_id' is required must be an array", )
        return;
    }
    
    // Validation
    try {
        validateRemoveAccessRights(access_rights);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        // Find the employee using `employee_id`
        const employee = await Employee.findOne({ where: { id: employee_id } });
        if (employee == null) {
            res.status(400).send(`Employee id ${employee_id} not found.`);
            return;
        }
        
        const user = res.locals.user;
        await removeAccessRights(access_rights, employee, user);

        res.send({ id: employee.id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;