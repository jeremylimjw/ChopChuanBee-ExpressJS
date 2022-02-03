var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const {LeaveAccount, LeaveType, updateLeaveAccounts, validateLeaveAccounts} = require('../models/LeaveAccount');
const {LeaveApplication, LeaveStatus, validateLeaveApplications} = require('../models/LeaveApplication');
const {Employee , Role, AccessRight  } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { sequelize } = require('../db');
const LeaveStatusEnum = require('../common/LeaveStatusEnum');
const { Sequelize } = require('sequelize');


// GET leave balance
// Return all leave accounts for the employee, or return one leave account if `leave_account_id` is given
// Roles access: Only employee can request their own, or HR role, or Admin
router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { employee_id, leave_account_id } = req.query;
  
  // If user is not the employee OR user doesnt have HR access role OR user is not Admin
  const user = res.locals.user;
  if (user.id != employee_id && user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
    res.status(401).send("You do not have access to this method.");
    return;
  }
  
  try {
    const currentBalances = await sequelize.query(
      `SELECT leave_accounts.id, leave_accounts.entitled_days, entitled_days - COALESCE(SUM(num_days), 0) AS balance, leave_types.name leave_type_name, leave_types.id leave_type_id
        FROM leave_accounts LEFT OUTER JOIN 
          (SELECT * FROM leave_applications WHERE leave_status_id = 2 AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) ) active_leave_applications
          ON active_leave_applications.leave_account_id = leave_accounts.id 
          LEFT JOIN leave_types ON leave_accounts.leave_type_id = leave_types.id
        WHERE TRUE
          ${employee_id == null ? '' : `AND employee_id = '${employee_id}'`}
          ${leave_account_id == null ? '' : `AND leave_accounts.id = '${leave_account_id}'`}
        GROUP BY leave_accounts.id, leave_types.id`,
      { 
        raw: true, 
        type: sequelize.QueryTypes.SELECT 
      }
    );

    // Transform leave_type to preferred format
    const transformedBalances = currentBalances.map(row => {
      const newRow = {
        ...row,
        leave_type: {
          id: row.leave_type_id,
          name: row.leave_type_name
        }
      }
      delete newRow['leave_type_id'];
      delete newRow['leave_type_name'];
      return newRow;
    });

    if (leave_account_id != null) {
      if (transformedBalances.length == 0) {
        res.status(400).send(`Leave account id ${leave_account_id} not found.`);
      } else {
        res.send(transformedBalances[0]);
      }

    } else {
      res.send(transformedBalances);
    }

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// POST Create leave account
router.post('/', requireAccess(ViewType.HR, true), async function(req, res, next) { 

  const { employee_id, entitled_days, leave_type_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || entitled_days == null || leave_type_id == null ) {
    res.status(400).send("'employee_id', 'entitled_days', 'leave_type_id' are required.", )
    return;
  }

  try {
    const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight});
  
    if (employee == null) {
        res.status(400).send(`Employee id ${employee_id} not found.`);
        return;
    }
    
    // check leave account not already created for leave type
    const hasLeaveAccount = await LeaveAccount.findOne({ where: { employee_id: employee.id, leave_type_id }, include: LeaveType });

    if (hasLeaveAccount != null) {
      res.status(400).send("Leave account for this leave type has already been created for this user.", )
      return;
    } 

    const newLeaveAccount = await LeaveAccount.create({ entitled_days, leave_type_id , employee_id : employee.id });
    
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} created a Leave Account record for ${employee.name}`, 
    });
    
    const leaveAccount = await LeaveAccount.findByPk(newLeaveAccount.id, { include: LeaveType });

    res.send(leaveAccount.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// PUT Edit Leave Account
router.put('/', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { leave_accounts } = req.body;
    
  // Validation
  try {
    validateLeaveAccounts(leave_accounts);
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    // Do nothing if array is empty
    if (leave_accounts.length == 0) {
      res.send({});
      return;
    }

    const user = res.locals.user;

    // Get employee
    const leaveAccount = await LeaveAccount.findByPk(leave_accounts[0].id, { include: Employee });

    await updateLeaveAccounts(leave_accounts, leaveAccount?.employee, user);
    
    res.send({});

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// POST create leave Application
// Roles access: Only employee can request their own leave account, or HR role, or Admin
router.post('/application', requireAccess(ViewType.GENERAL), async function(req, res, next) { 
  const { leave_account_id, paid, start_date, end_date, num_days, remarks } = req.body;

  // Validation
  if (paid == null || start_date == null || end_date == null 
      || num_days == null || leave_account_id == null ) {
    res.status(400).send("'leave_account_id', 'paid', 'start_date', 'end_date', 'num_days' are required.", )
    return;
  }

  try {
    const leaveAccount = await LeaveAccount.findByPk(leave_account_id, { include: Employee });
  
    if (leaveAccount == null) {
        res.status(400).send(`Leave account id ${leave_account_id} not found.`);
        return;
    }

    // If user is not the employee OR user doesnt have HR access role OR user is not Admin
    const user = res.locals.user;
    if (user.id != leaveAccount.employee_id && user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
      res.status(401).send("You do not have access to this method.");
      return;
    }
   
    const currentBalance = await sequelize.query(
      `SELECT leave_accounts.id, leave_accounts.entitled_days, entitled_days - COALESCE(SUM(num_days), 0) AS balance, leave_types.name leave_type_name, leave_types.id leave_type_id
        FROM leave_accounts LEFT OUTER JOIN 
          (SELECT * FROM leave_applications WHERE leave_status_id = 2 AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) ) active_leave_applications
          ON active_leave_applications.leave_account_id = leave_accounts.id 
          LEFT JOIN leave_types ON leave_accounts.leave_type_id = leave_types.id
        WHERE leave_accounts.id = '${leave_account_id}'
        GROUP BY leave_accounts.id, leave_types.id`,
       { raw: true, 
       type: sequelize.QueryTypes.SELECT}
    );

    if (currentBalance[0].balance - num_days < 0){
      res.status(400).send(`Employee does not have sufficient balance (left ${currentBalance[0].balance}) to apply`,)
      return;
    }

    const leaveApplication = await LeaveApplication.create({ paid, start_date, end_date, num_days, remarks, leave_account_id : leaveAccount.id, leave_status_id : 1 });

    // Record to admin logs
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} created a Leave Application record for ${leaveAccount.employee.name}`, 
    });
 
    res.send(leaveApplication);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


/**
 * GET all leave applications 
 * 4 ways to retrieve:
 * - One leave application with `leave_application_id`
 * - All leave applications from a leave account with `leave_account_id`
 * - All leave application from an employee with `employee_id`
 * - All leave applications (HR and admin only)
 * Roles access: Only employee can request their own leave account, or HR role, or Admin
 */
router.get('/application', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { employee_id, leave_account_id, leave_application_id } = req.query;

  const user = res.locals.user;
  
  try {
    // One leave application with `leave_application_id`
    if (leave_application_id != null) {
      const leaveApplication = await LeaveApplication.findByPk(leave_application_id, { 
        include: [
          { 
            model: LeaveAccount, 
            include: { model: Employee, attributes: [] }, 
            attributes: ['employee_id']
          }, 
          LeaveStatus
        ] 
      });

      if (leaveApplication == null) {
        res.status(400).send(`Leave application id ${leave_application_id} not found.`);
        return;
      }

      // If user is not the employee OR user doesnt have HR access role OR user is not Admin
      if (user.id != leaveApplication.leave_account.employee_id && user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
        res.status(401).send("You do not have access to this method.");
        return;
      }

      res.send(leaveApplication.toJSON());
      
    } 

    // All leave applications from a leave account with `leave_account_id`
    else if (leave_account_id != null) {
      const leaveApplications = await LeaveApplication.findAll({ where: { leave_account_id }, 
        include: [
          { 
            model: LeaveAccount, 
            include: { model: Employee, attributes: [] }, 
            attributes: ['employee_id'] 
          }, 
          LeaveStatus
        ] });

      // If user is not the employee OR user doesnt have HR access role OR user is not Admin
      if (leaveApplications.length !== 0 && user.id != leaveApplications[0].leave_account.employee_id && user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
        res.status(401).send("You do not have access to this method.");
        return;
      }

      res.send(leaveApplications);

    } 

    // All leave application from an employee with `employee_id`
    else if (employee_id != null) {
      const leaveApplications = await LeaveApplication.findAll({ include: [
        { 
          model: LeaveAccount, 
          include: { model: Employee, attributes: [] }, 
          attributes: ['employee_id'],
          where: { employee_id } 
        }, 
        LeaveStatus
      ] });

      // If user is not the employee OR user doesnt have HR access role OR user is not Admin
      if (leaveApplications.length !== 0 && user.id != leaveApplications[0].leave_account.employee_id && user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
        res.status(401).send("You do not have access to this method.");
        return;
      }
      
      res.send(leaveApplications);
      
    } 
    
    // All leave applications
    else {
      // If user doesnt have HR access role OR user is not Admin
      if (user.access_rights[ViewType.HR] == null && user.role.name !== 'Admin') {
        res.status(401).send("You do not have access to this method.");
        return;
      }

      const leaveApplications = await LeaveApplication.findAll({ include: [{ model: LeaveAccount, include: Employee, attributes: [] }, LeaveStatus] });
      res.send(leaveApplications);

    }
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// PUT Edit leave application (approve/reject)
router.put('/application', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { leave_applications } = req.body;

  // Validation
  if (leave_applications == null) {
    res.status(400).send("'leave_accounts' is required.");
  }

  // More validation
  if (!Array.isArray(leave_applications)) {
    res.status(400).send("'leave_accounts' must be an array.");
    return;
  }

  // Even more validation
  for (let leave_application of leave_applications) {
    if (leave_application.id == null || leave_application.leave_status_id == null) {
      res.status(400).send(`'leave_accounts' array must be in { id: number, leave_status_id: number } format.`);
      return;
    }
  }

  try {
    // Do nothing if array is empty
    if (leave_applications.length == 0) {
      res.send({});
      return;
    }

    const leaveApplications = await LeaveApplication.findAll(
      { 
        where: { id: { [Sequelize.Op.or]: leave_applications.map(element => element.id) } },
        include: { model: LeaveAccount, include: Employee } 
      }
    );

    for (let leaveApplication of leaveApplications) {
      // Must be PENDING then can update
      if (leaveApplication.leave_status_id !== 1 ) {
        res.status(400).send("Leave application status has already been approved or rejected.");
        return;
      }

      const newLeaveStatusId = leave_applications.find(element => element.id == leaveApplication.id).leave_status_id;

      // Only allow approve or reject updates
      if (newLeaveStatusId != 2 && newLeaveStatusId != 3) {
        res.status(400).send("You can only approve or reject leave applications.");
        return;
      }
      leaveApplication.leave_status_id = newLeaveStatusId;

      // Update the application
      await leaveApplication.save();

      // Get leave status name for admin loggings
      const leaveStatus = Object.keys(LeaveStatusEnum).filter(key => LeaveStatusEnum[key].id == leaveApplication.leave_status_id)[0];

      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} ${leaveStatus} ${leaveApplication.leave_account.employee.name}'s leave application`, 
      });

    }

    res.send({});

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// DELETE Edit leave application (cancel)
router.delete('/application', requireAccess(ViewType.GENERAL, true), async function(req, res, next) {
  const { id } = req.query;

  // Validation
  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const leaveApplication = await LeaveApplication.findByPk(id, { include: { model: LeaveAccount, include: Employee }});
  
    if (leaveApplication == null) {
      res.status(400).send(`Leave application id ${id} not found.`);
      return;
    }

    // Only allow owner or Admin to access
    const user = res.locals.user;
    if (leaveApplication.leave_account.employee_id !== user.id && user.role.name !== 'Admin') {
      res.status(401).send("You do not have access to this method.");
      return;
    }

    if (leaveApplication.leave_status_id === 3 ) {
      res.status(400).send("Leave application status has been rejected, cannot cancel");
      return;
    }
    
    const currentDate = new Date();

    if (leaveApplication.leave_status_id === 2 && leaveApplication.start_date < currentDate) {
        res.status(400).send("Past approved leave applications cannot be cancelled");
        return;
    }

    leaveApplication.leave_status_id = 4;
    await leaveApplication.save();

    // Record to admin logs
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} cancelled ${leaveApplication.leave_account.employee.name}'s leave application`, 
    });

    res.send({ id: id });

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
