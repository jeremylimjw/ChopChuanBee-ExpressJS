var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, AccessRight } = require('../models/Employee');
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

    // More validation
    for (let access_right of access_rights) {
        if (access_right.view_id == null || access_right.has_write_access == null) {
            res.status(400).send(`'access_rights' array must be in { view_id: number, has_write_access: boolean } format.`);
            return;
        }
    }
    
    try {
        const user = res.locals.user;

        // Find the employee using `employee_id`
        const employee = await Employee.findOne({ where: { id: employee_id } });
        if (employee == null) {
            res.status(400).send(`Employee id ${employee_id} not found.`);
            return;
        }
        
        for (let access_right of access_rights) {
            // Create the access right
            await AccessRight.upsert({ 
                has_write_access: access_right.has_write_access, 
                employee_id: employee.id, view_id: 
                access_right.view_id 
            })
            
            // Get view name with `view_id`
            const viewName = Object.keys(ViewType).filter(key => ViewType[key].id == access_right.view_id);

            // Record in admin logs
            await Log.create({ 
              employee_id: user.id, 
              view_id: ViewType.ADMIN.id,
              text: `${user.name} granted ${viewName} access to ${employee.name}${access_right.has_write_access ? ' with write access' : ''}`, 
            });
        }

        res.send(employee.id);

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
    if (employee_id == null || access_rights == null || !Array.isArray(access_rights)) {
        res.status(400).send("'employee_id' is required and 'access_rights' must be an array", )
        return;
    }

    // More validation
    for (let access_right of access_rights) {
        if (access_right.view_id == null) {
            res.status(400).send(`'access_rights' array must be in { view_id: number } format.`);
            return;
        }
    }
    
    try {
        const user = res.locals.user;

        // Find the employee using `employee_id`
        const employee = await Employee.findOne({ where: { id: employee_id } });
        if (employee == null) {
            res.status(400).send(`Employee id ${employee_id} not found.`);
            return;
        }
        
        for (let access_right of access_rights) {
            const accessRight  = await AccessRight.findOne({ where: { view_id: access_right.view_id } })

            if (accessRight != null) {
                // Delete the access right
                await AccessRight.destroy({ where: { view_id: access_right.view_id } });

                // Find the view name using `view_id`
                const viewName = Object.keys(ViewType).filter(key => ViewType[key].id == access_right.view_id);

                // Record in admin logs
                await Log.create({ 
                    employee_id: user.id, 
                    view_id: ViewType.ADMIN.id,
                    text: `${user.name} revoked ${viewName} access from ${employee.name}`, 
                });
            }
        }

        res.send(employee.id);

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


module.exports = router;