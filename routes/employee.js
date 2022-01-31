const express = require('express');
const { requireAccess } = require('../auth');
const crypto = require('crypto');
const { hashPassword, compareHash } = require('../auth/bcrypt');
const router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, AccessRight, Role } = require('../models/Employee');
const View = require('../models/View');
const Log = require('../models/Log');
const { sendEmailTo } = require('../emailer/index');

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
            const employee = await Employee.findOne({ where: { id: id }, include: [{ model: AccessRight, include: View }, Role] });
            if (employee == null) {
                res.status(400).send(`Employee id ${id} not found.`);
                return;
            }

            res.send(employee.toJSON());

        } 
        // Retrieve ALL employees
        else {
            const employees = await Employee.findAll({ include: [{ model: AccessRight, include: View }, Role] });

            res.send(employees);
        }
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


/**
 *  POST method: Create employee
 *  - /api/employee
 *  - requireAccess(ViewType.ADMIN, true)
 * */ 
router.post('/', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
    const { name, username, email, role_id, contact_number, nok_name, nok_number, address, postal_code, send_email } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (name == null || username == null || email == null, role_id == null, send_email == null) {
        res.status(400).send("'name', 'username', 'email', 'role_id', 'send_email are required.")
        return;
    }

    try {
        // Enforce username unique constraint
        const hasUsername = await Employee.findOne({ where: { username: username }});

        if (hasUsername != null) {
            res.status(400).send(`Username ${username} is already taken.`)
            return;
        }

        // Generate random password
        const passwordPlaintext = crypto.createHash('sha1').update(Math.random().toString()).digest('hex').substring(0, 8);
        const password = await hashPassword(passwordPlaintext);

        // Create new employee
        const newEmployee = await Employee.create({ name, username, password, email, role_id, contact_number, nok_name, nok_number, address, postal_code });

        if (send_email == true) {
            // Send account information to user's email
            await sendEmailTo(newEmployee.email, 'newEmployee', { 
                subject: "New Account Created", 
                name: newEmployee.name, 
                username: newEmployee.username, 
                password: passwordPlaintext 
            });
        }
        
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.ADMIN.id,
            text: `${user.name} created an employee record for ${newEmployee.name}`, 
        });

        // Replace hashed password with random generated password before sending response
        const employee = newEmployee.toJSON();
        employee.password = passwordPlaintext;

        res.send(employee);

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

    // Validation
    if (old_password == null || new_password == null) {
        res.status(400).send("'old_password', 'new_password' are required.", )
        return;
    }
    
    try {
        const user = res.locals.user;

        // Retrieve the employee
        const employee = await Employee.findOne({ where: { id: user.id } });
        if (employee == null) {
            res.status(400).send(`Logged in user ${user?.name} does not exist anymore.`);
            return;
        }

        // Verify old password
        const match = await compareHash(old_password, employee.password)
        if (!match) {
            res.status(403).send("Old password does not match.");
            return;
        }

        // Update the employee object
        employee.password = await hashPassword(new_password);
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


/**
 *  POST method: Reset password of a given user (employee)
 *  - /api/employee/resetPassword
 *  - requireAccess(ViewType.GENERAL) will only check if user is logged in, and logged in user can be accessed via `res.locals.user`
 * */ 
router.post('/resetPassword', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { email } = req.body;

    // Validation
    if (email == null) {
        res.status(400).send("'email' is required.", )
        return;
    }

    try {
        const user = res.locals.user;

        // Retrieve the employee
        const employee = await Employee.findOne({ where: { id: user.id } });
        if (employee == null) {
            res.status(400).send(`Logged in user ${user?.name} does not exist anymore.`);
            return;
        }

        // Verify correct email
        if (employee.email != email) {
            res.status(400).send(`Email ${email} does not match the employee.`);
            return;
        }
        
        // Randomly generate 8 character password
        const newPassword = crypto.createHash('sha1').update(Math.random().toString()).digest('hex').substring(0,6);

        // Update the employee object
        employee.password = await hashPassword(newPassword);
        await employee.save();

        // Send new password to user's email
        await sendEmailTo(employee.email, 'resetPassword', { 
            subject: "Reset Password", 
            name: employee.name, 
            newPassword 
        })

        // Record to admin logs
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.GENERAL.id,
          text: `${user.name} resetted his/her password`, 
        });

        res.send(user.id);

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router; 
