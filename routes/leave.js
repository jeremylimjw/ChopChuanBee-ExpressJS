var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const {LeaveAccount, LeaveType} = require('../models/LeaveAccount');
const {LeaveApplication, LeaveStatus} = require('../models/LeaveApplication');
const {Employee , Role, AccessRight  } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { sequelize } = require('../db');


// GET leave balance
router.get('/account', requireAccess(ViewType.HR, false), async function(req, res, next) {
  const { employee_id, leave_account_id } = req.query;

  // Attribute validation here.
  if (employee_id == null) {
    res.status(400).send("'employee_id' is required.", )
    return;
  }
  
  try {
    const employee = await Employee.findOne({ where: { id: employee_id } });
    
    if (employee == null) {
        res.status(400).send(`Employee id ${employee_id} not found.`);
        return;
    }

    const currentBalances = await sequelize.query(
      `SELECT leave_accounts.id, entitled_days - COALESCE(SUM(num_days), 0) AS balance, leave_types.id leave_type_id, leave_types.name leave_type_name
          FROM leave_accounts 
            LEFT JOIN leave_types ON leave_type_id = leave_types.id
            LEFT OUTER JOIN leave_applications ON leave_account_id = leave_applications.id 
          AND employee_id = '${employee_id}' 
          ${leave_account_id == null ? '' : `AND leave_accounts.id = '${leave_account_id}'`}
          AND leave_status_id = 2 
          AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) 
          GROUP BY leave_accounts.id, leave_types.id`,
      { 
        raw: true, 
        type: sequelize.QueryTypes.SELECT 
      }
    );

    const transformedBalances = [];


    // Transform leave_type to preferred format
    for (let row of currentBalances) {
      transformedBalances.push({
        ...row,
        leave_type: {
          id: row.leave_type_id,
          name: row.leave_type_name
        }
      })
      delete row['leave_type_id'];
      delete row['leave_type_name'];
    }

    res.send(transformedBalances);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// POST Ceate leave account
router.post('/account', requireAccess(ViewType.HR, true), async function(req, res, next) { 

  const { employee_id, entitled_days, entitled_rollover, leave_type_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || entitled_days == null 
      || entitled_rollover == null || leave_type_id == null ) {
    res.status(400).send("'employee_id', 'entitled_days', 'entitled_rollover', 'leave_type_id' are required.", )
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

    const newLeaveAccount = await LeaveAccount.create({ entitled_days, entitled_rollover, leave_type_id , employee_id : employee.id });
    
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
router.put('/account', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { employee_id, entitled_days, leave_account_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || entitled_days == null || leave_account_id == null ) {
    res.status(400).send("'employee_id', 'entitled_days', 'leave_account_id' are required.", )
    return;
  }

  try {
    const employee = await Employee.findOne({ where: { id: employee_id }});
    
    const result = await LeaveAccount.update(
      { entitled_days },
      { where: { employee_id, leave_account_id} }
    );

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Leave Account id ${leave_account_id} is not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} updated ${employee.name}'s Leave Account record`, 
      });

      res.send({ leave_account_id });
    }

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// POST create leave Application
router.post('/application', requireAccess(ViewType.HR, false), async function(req, res, next) { 
  const { employee_id, paid, start_date, end_date, num_days, remarks, leave_account_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || paid == null 
      || start_date == null || end_date == null 
      || num_days == null || leave_account_id == null ) {
    res.status(400).send("'employee_id', 'paid', 'start_date', 'end_date', 'num_days', 'leave_account_id' are required.", )
    return;
  }

  try {
    const leaveAccount = await LeaveAccount.findByPk(leave_account_id);
  
    if (leaveAccount == null) {
        res.status(400).send(`Leave account id ${leave_account_id} not found.`);
        return;
    }
   
    const currentBalance = await sequelize.query(
      `SELECT entitled_days - COALESCE(SUM(num_days), 0) AS balance
          FROM leave_accounts 
            LEFT OUTER JOIN leave_applications ON leave_account_id = leave_applications.id 
          AND leave_accounts.id = '${leave_account_id}'
          AND leave_status_id = 2 
          AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) 
          GROUP BY leave_accounts.id`,
       { raw: true, 
       type: sequelize.QueryTypes.SELECT}
    );
    
    if (currentBalance[0].balance < num_days){
      res.status(400).send("Employee does not have sufficient leave to apply",)
      return;
    }

    const leaveApplication = await LeaveApplication.create({ paid, start_date, end_date, num_days, remarks, leave_account_id : leaveAccount.id, leave_status_id : 1 });

    // Record to admin logs
    const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight});
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} created a Leave Application record for ${employee.name}`, 
    });
 
    res.send(leaveApplication);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// GET all leave applications 
router.get('/application', requireAccess(ViewType.CRM, false), async function(req, res, next) {
  const { employee_id } = req.query;
  
  try {
    if (employee_id != null) {
      const leaveApplications = await LeaveApplication.findAll({ include: LeaveStatus });
      res.send(leaveApplications);
      return;

    } else {
      const leaveApplications = await LeaveApplication.findAll({ where: { employee_id }, include: LeaveStatus });
      res.send(leaveApplications);
    }
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// PUT Edit leave application (approve/reject/cancel)
router.put('/application', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { leave_application_id, leave_status_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (leave_application_id == null || leave_status_id == null) {
    res.status(400).send("'leave_application_id' and 'leave_status_id' are required.", )
    return;
  }

  try {
    const leaveApplication = await LeaveApplication.findByPk(leave_application_id, { include: { model: LeaveAccount, include: Employee }});
  
    if (leaveApplication == null) {
      res.status(400).send(`Leave application id ${leave_application_id} not found.`);
      return;
    }

    if (leaveApplication.leave_status_id !== 1 ) {
      res.status(400).send("Leave application status has already been approved/rejected/cancelled.");
      return;
    }

    leaveApplication.leave_status_id = leave_status_id;
    await leaveApplication.save();

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} approved/rejected ${leaveApplication.leave_account.employee.name}'s Leave Application`, 
    });

    res.send(leave_application_id);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


// DELETE leave application -> set status to cancelled
router.delete('/application', requireAccess(ViewType.HRM, true), async function(req, res, next) {
  const { leave_application_id } = req.query;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (leave_application_id == null) {
    res.status(400).send("'leave_application_id' is required.", )
    return;
  }

  try {
    const leaveApplication = await LeaveApplication.findByPk(leave_application_id, { include: { model: LeaveAccount, include: Employee }});

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (leaveApplication == null) {
      res.status(400).send(`Leave Application id ${leave_application_id} not found.`)
      return;
    } 
    
    if (leaveApplication.leave_status_id !== 1) {
      res.status(400).send(`Leave Application has already been approved/rejected/cancelled.`)
      return;
    
    }

    leaveApplication.leave_status_id = 4;
    leaveApplication.save();

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} cancelled ${leaveApplication.leave_account.employee.name}'s Leave Application`, 
    });

    res.send(leave_application_id);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

module.exports = router;
