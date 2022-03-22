const express = require('express');
const { requireAccess } = require('../auth');
const crypto = require('crypto');
const { hashPassword, compareHash } = require('../auth/bcrypt');
const router = express.Router();
const ViewType = require('../common/ViewType');
const { Employee, Role } = require('../models/Employee');
const { LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
const View = require('../models/View');
const Log = require('../models/Log');
const { sendEmailTo } = require('../emailer/index');
const { Sequelize, DataTypes } = require('sequelize');
const { AccessRight, validateAccessRights, removeAccessRights, insertAccessRights } = require('../models/AccessRight');
const { assertNotNull, parseRequest } = require('../common/helpers');

/**
 * Employee route
 * All routes here will be trailed with /api/employee, configured in routes/index.js
 */


/**
 *  GET method: Get employees
 *  - e.g. /api/employee OR /api/employee?id=123
 *  - requireAccess(ViewType.HR, false)
 * */ 
router.get('/', requireAccess(ViewType.HR, false), async function(req, res, next) {
    const predicate = parseRequest(req.query);
    
    try {
        predicate.order = predicate.order || [];
        predicate.order.push([AccessRight, 'has_write_access', 'DESC']);
        predicate.include = [{ model: AccessRight, include: View }, Role];

        const employees = await Employee.findAll(predicate);
        res.send(employees);
      
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

    try {
      assertNotNull(req.body, ['name', 'username', 'email', 'role_id', 'send_email'])
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

        // Enforce email unique constraint
        const hasEmail = await Employee.findOne({ where: { email: email }});

        if (hasEmail != null) {
            res.status(400).send(`Email ${email} is already taken.`)
            return;
        }

        // Generate activation token
        const activation_token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');

        // Create new employee
        const newEmployee = await Employee.create(
            { name, username, email, role_id, contact_number, nok_name, nok_number, address, postal_code, access_rights, activation_token, leave_accounts: STANDARD_LEAVE_ACCOUNTS }, 
            { include: [AccessRight, LeaveAccount] }
        );

        if (send_email == true) {
            // Send account information to user's email
            sendEmailTo(newEmployee.email, 'newEmployee', { 
                subject: "New Account Created", 
                name: newEmployee.name, 
                activation_token: activation_token 
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
    const { id, name, email, role_id, contact_number, nok_name, nok_number, address, postal_code } = req.body;
    
    try {
      assertNotNull(req.body, ['id', 'name', 'email', 'role_id'])
    } catch(err) {
      res.status(400).send(err);
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


router.post('/deactivate', requireAccess(ViewType.HR, true), async function(req, res, next) {
    const { id } = req.body;

    if (id == null) {
        res.status(400).send("'id' is required.", )
        return;
    }

    try {
        const employee = await Employee.findByPk(id);

        if (employee == null) {
        res.status(400).send(`Employee id ${id} not found.`)

        } else {
        employee.discharge_date = new Date();
        employee.save();

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
            employee_id: user.id, 
            view_id: ViewType.ADMIN.id,
            text: `${user.name} deactivated ${employee.name}'s record`, 
        });

        res.send({ id: employee.id, discharge_date: employee.discharge_date });
        }


    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/activate', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const employee = await Employee.findByPk(id);

    if (employee == null) {
      res.status(400).send(`Employee id ${id} not found.`)

    } else {
      employee.discharge_date = null;
      employee.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ADMIN.id,
        text: `${user.name} activated ${employee.name}'s record`, 
      });

      res.send({ id: employee.id, discharge_date: null });
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
    const { email } = req.body;

    try {
        assertNotNull(req.body, ['email'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }

    try {
        // Retrieve the employee
        const employee = await Employee.findOne({ where: { email } });
        if (employee == null) {
            res.status(400).send(`This email is not registered.`);
            return;
        }

        // Generate activation token
        const activation_token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');

        // Update the employee object
        employee.activation_token = activation_token;
        await employee.save();

        // Send new password to user's email
        sendEmailTo(employee.email, 'resetPassword', { 
            subject: "Reset Password", 
            name: employee.name, 
            activation_token: activation_token, 
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

/**
 *  GET method: Get employees by activation code only
 *  This route has no role access
 * */ 
router.get('/activateAccount', async function(req, res, next) {
    const { activation_token } = req.query;

    try {
        assertNotNull(req.query, ['activation_token'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const employees = await Employee.findAll({ where: { activation_token }});
        res.send(employees);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }

});

/**
 *  POST method: Set the password of an account with the password
 *  This route has no role access
 * */ 
router.post('/activateAccount', async function(req, res, next) {
    const { activation_token, password } = req.body

    try {
        assertNotNull(req.body, ['activation_token', 'password'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const employees = await Employee.update({ password: await hashPassword(password), activation_token: null }, { where: { activation_token }});
        res.send(employees);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }

});

module.exports = router; 
