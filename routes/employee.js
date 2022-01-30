var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, AccessRight } = require('../models/Employee');
const View = require('../models/View');

/**
 * Employee route
 * All routes here will be trailed with /api/employee, configured in routes/index.js
 */


/**
 *  GET method: View all employees or a single employee if id is given
 *  - e.g. /api/employee OR /api/employee?id=123
 *  - requireAccess(ViewType.HR, false)
 * */ 
router.get('/', requireAccess(ViewType.HR, false), async function(req, res, next) {
    const { id } = req.query;

    try {
        // Retrieve a single employee
        if (id != null) {
            const employee = await Employee.findOne({ where: { id: id }, include: { model: AccessRight, include: View } });

            if (employee == null) {
                res.status(400).send(`Employee id ${id} not found.`);
                return;
            }

            res.send(employee.toJSON());

        } 
        // Retrieve ALL employees
        else {
            const employees = await Employee.findAll({ include: { model: AccessRight, include: View }});

            res.send(employees);
        }
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


module.exports = router; 