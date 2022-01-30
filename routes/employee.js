var express = require('express');
const { requireAccess } = require('../auth');
const { compare, hash } = require('../auth/bcrypt');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, AccessRight } = require('../models/Employee');
const Log = require('../models/Log');
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


/**
 *  POST method: Change password of a given user (employee)
 *  - /api/employee/changePassword
 *  - requireAccess(ViewType.GENERAL) will only check if user is logged in, and logged in user can be accessed via `res.locals.user`
 * */ 
router.post('/changePassword', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { old_password, new_password } = req.body;

    if (old_password == null || new_password == null) {
        res.status(400).send("'old_password', 'new_password' are required.", )
        return;
    }
    
    try {
        const user = res.locals.user;

        const employee = await Employee.findOne({ where: { id: user.id } });
        if (employee == null) {
            res.status(400).send(`Logged in user ${user?.name} does not exist anymore.`);
            return;
        }

        const match = await compare(old_password, employee.password)
        if (!match) {
            res.status(403).send("Old password does not match.");
            return;
        }

        // Update the employee object
        employee.password = await hash(new_password);
        await employee.save();

        // Record to admin logs
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.GENERAL.id,
          text: `${user.name} changed his/her password`, 
        });

        res.send(user.id);

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


module.exports = router;