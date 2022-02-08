const express = require('express');
const { requireAccess } = require('../auth');
const crypto = require('crypto');
const { hashPassword, compareHash } = require('../auth/bcrypt');
const router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, Role } = require('../models/Employee');
const { LeaveAccount } = require('../models/LeaveAccount');
const View = require('../models/View');
const Log = require('../models/Log');
const { sendEmailTo } = require('../emailer/index');
const { Sequelize, DataTypes } = require('sequelize');
const { AccessRight, validateAccessRights, removeAccessRights, insertAccessRights } = require('../models/AccessRight');

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
    const { name, username, email, role_id, contact_number, nok_name, nok_number, address, postal_code, send_email, access_rights } = req.body;

    // Validation
    if (name == null || username == null || email == null, role_id == null, send_email == null) {
        res.status(400).send("'name', 'username', 'email', 'role_id', 'send_email are required.")
        return;
    }
    
    // Access Rights Validation
    try {
        validateAccessRights(access_rights);
    } catch(err) {
        res.status(400).send(err);
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

        // Standard leave accounts
        const leave_accounts = [
            { entitled_days : 14, leave_type_id : 1 },
            { entitled_days : 0, leave_type_id : 2 },
            { entitled_days : 0, leave_type_id : 3 },
            { entitled_days : 0, leave_type_id : 4 },
            { entitled_days : 0, leave_type_id : 5 },
        ];

        // Create new employee
        const newEmployee = await Employee.create(
            { name, username, password, email, role_id, contact_number, nok_name, nok_number, address, postal_code, access_rights, leave_accounts }, 
            { include: [AccessRight, LeaveAccount] }
        );

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

        // Retrieve employee again to get the access right and view associations
        const getEmployee = await Employee.findByPk(newEmployee.id, { include: { model: AccessRight, include: View }})

        // Replace hashed password with random generated password before sending response
        const employee = getEmployee.toJSON();
        employee.password = passwordPlaintext;

        res.send(employee);

    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});


/**
 *  PUT method: Update a employee given the data in the HTTP body
 *  - /api/employee
 *  - requireAccess(ViewType.HR)
 * */ 
router.put('/', requireAccess(ViewType.HR), async function(req, res, next) {
    const { id, name, email, role_id, contact_number, nok_name, nok_number, address, postal_code, access_rights } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null || name == null || email == null ||
        role_id == null || contact_number == null ||
        nok_name == null || nok_number == null ||
        address == null || postal_code == null) {
        res.status(400).send("'id', 'name', 'username', 'email', 'role_id', 'contact_number', 'nok_name', 'nok_number', 'address', 'postal_code' are required.", )
        return;
    }
    
    const user = res.locals.user;

    try {
        // Validate unique constraint
        const hasEmail = await Employee.findOne({ where: { email, id: { [Sequelize.Op.not]: id } } });

        if (hasEmail != null) {
            res.status(401).send(`Email ${email} is already taken.`);
            return;
        }

        // Update employee
        const updateResult = await Employee.update(
            { name, email, role_id, contact_number, nok_name, nok_number, address, postal_code },
            { where: { id: id } }
        );

        // If 'id' is not found return 400 Bad Request, if found then return the 'id'
        if (updateResult[0] === 0) {
            res.status(400).send(`Employee id ${id} not found.`);
            return;
        }

        // Access Rights Validation
        try {
            validateAccessRights(access_rights);
        } catch(err) {
            res.status(400).send(err);
            return;
        }

        const employee = await Employee.findByPk(id, { include: AccessRight });
        await removeAccessRights(employee.toJSON().access_rights, employee, user, true);
        await insertAccessRights(access_rights, employee, user, true);

        // Record to admin logs
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.HR.id,
            text: `${user.name} updated ${name}'s employee record`, 
        });

        res.send({ id: id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


/**
 *  DELETE method: Update a employee 'deleted' attribute
 *  - /api/employee
 *  - requireAccess(ViewType.HR, true) because this is writing data
 * */ 
router.delete('/', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { id } = req.query;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const employee = await Employee.findByPk(id);

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (employee == null) {
      res.status(400).send(`Employee id ${id} not found.`)

    } else {
      employee.deleted = true;
      employee.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} deleted ${employee.name}'s record`, 
      });

      res.send({ id: employee.id });
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

        res.send({ id: user.id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


/**
 *  POST method: Reset password of a given user (employee)
 *  - /api/employee/resetPassword
 * */ 
router.post('/resetPassword', async function(req, res, next) {
    const { username, email } = req.body;

    // Validation
    if (username == null || email == null) {
        res.status(400).send("'username' and 'email' are required.", )
        return;
    }

    try {
        // Retrieve the employee
        const employee = await Employee.findOne({ where: { username, email } });
        if (employee == null) {
            res.status(400).send(`Invalid username and/or email.`);
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
          employee_id: employee.id, 
          view_id: ViewType.GENERAL.id,
          text: `${employee.name} resetted his/her password`, 
        });

        res.send({ id: employee.id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


/**
 *  PUT method: Update a employee given the data in the HTTP body
 *  - /api/employee/profile
 *  - requireAccess(ViewType.GENERAL)
 * */ 
router.put('/profile', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { id, name, email, contact_number, nok_name, nok_number, address, postal_code } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null || name == null || email == null || contact_number == null ||
        nok_name == null || nok_number == null ||
        address == null || postal_code == null) {
        res.status(400).send("'id', 'name', 'username', 'email', 'contact_number', 'nok_name', 'nok_number', 'address', 'postal_code' are required.", )
        return;
    }
    
    const user = res.locals.user;

    try {
        // Validate unique constraint
        const hasEmail = await Employee.findOne({ where: { email, id: { [Sequelize.Op.not]: id } } });

        if (hasEmail != null) {
            res.status(401).send(`Email ${email} is already taken.`);
            return;
        }

        // Update employee
        const updateResult = await Employee.update(
            { name, email, contact_number, nok_name, nok_number, address, postal_code },
            { where: { id: id } }
        );

        // If 'id' is not found return 400 Bad Request, if found then return the 'id'
        if (updateResult[0] === 0) {
            res.status(400).send(`Employee id ${id} not found.`);
            return;
        }

        // Record to admin logs
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.GENERAL.id,
            text: `${user.name} updated his/her employee record`, 
        });

        res.send({ id: id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router; 
