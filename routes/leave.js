var express = require('express');
var router = express.Router();
var HashMap = require('hashmap');
const { requireAccess } = require('../auth');
const {LeaveAccount, LeaveType} = require('../models/LeaveAccount');
const {LeaveApplication, LeaveStatus} = require('../models/LeaveApplication');
const {Employee , Role, AccessRight  } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { sequelize } = require('../db');

// view leave balance
router.get('/viewLeaveAccounts', requireAccess(ViewType.HR, false), async function(req, res, next) {
  const { employee_id } = req.query; // This is same as `const id = req.params.id`;
  
  try {
    const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight });
    
    if (employee == null) {
        res.status(400).send(`Employee id ${employee_id} not found.`);
        return;
    }

    const leaveAccounts = await LeaveAccount.findAll({ where: { employee_id: employee.id }, include: LeaveType});
    var map = new HashMap();
    for (const leaveAccount of leaveAccounts) {
          var currBalance = await sequelize.query(
            'SELECT leaveAcc.entitled_days - SUM(leaveApp.num_days) AS amt ' +
            'FROM leave_accounts leaveAcc, leave_applications leaveApp ' +
            'WHERE leaveApp.leave_account_id = leaveAcc.id ' +
            `AND leaveAcc.id::text = '${leaveAccount.id}' ` +
            'AND leaveApp.leave_status_id = 2 ' + 
            'AND extract(year from leaveApp.start_date) = extract(year from current_date) ' +
            'GROUP BY leaveAcc.id',
            { raw: true, 
              type: sequelize.QueryTypes.SELECT}
            );

          if (currBalance[0]) {
            map.set(leaveAccount.id, currBalance[0].amt);
          } else {
            map.set(leaveAccount.id, leaveAccount.entitled_days);
          }
        };
      res.send({leave_accounts:leaveAccounts, map});

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }


});

//create leave account
router.post('/createLeaveAccount', requireAccess(ViewType.HR, true), async function(req, res, next) { 

    const {employee_id, entitled_days, entitled_rollover, leave_type_id } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (employee_id == null || entitled_days == null 
        || entitled_rollover == null || leave_type_id == null ) {
      res.status(400).send("'employee_id', 'entitled_days', 'entitled_rollover', 'leave_type_id' are required.", )
      return;
    }
  
    try {
        
        
      const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight})
      var leave_account = await LeaveAccount.findOne({ where: { employee_id: employee.id, leave_type_id }, include: LeaveType});
      // check leave account not already created for leave type
      if (leave_account == null) {
        leave_account = await LeaveAccount.create({ entitled_days, entitled_rollover, leave_type_id , employee_id : employee.id});
      } else {
        res.status(400).send("Leave account for this leave type has already been created for this user.", )
        return;
      }
      // console.log("Employee.id" + employee.id);
      // console.log("Employee_id"+ employee_id);
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} created a leave account record for ${employee.name}`, 
      });
   
     res.send({ id: leave_account.id });
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//create leave Application
router.post('/createLeaveApplication', requireAccess(ViewType.HR, false), async function(req, res, next) { 

  const {employee_id, paid, start_date, end_date, num_days, remarks, leave_type_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || paid == null 
      || start_date == null || end_date == null 
      || num_days == null || leave_type_id == null ) {
    res.status(400).send("'employee_id', 'paid', 'start_date', 'end_date', 'num_days', 'leave_type_id' are required.", )
    return;
  }

  try {
      
      
    const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight});
    const leave_account = await LeaveAccount.findOne({ where: { employee_id: employee.id, leave_type_id }, include: LeaveType});
    const leave_application = await LeaveApplication.create({ paid, start_date, end_date, num_days, remarks, leave_account_id : leave_account.id, leave_status_id : 1 });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} created a leave application record for ${employee.name}`, 
    });
 
   res.send({ id: leave_application.id });

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});

// manage Leave Account (edit entitled days and rollovers)
router.put('/manageLeaveAccount', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { employee_id, entitled_days, entitled_rollover, leave_type_id} = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (employee_id == null || entitled_days == null 
    || entitled_rollover == null || leave_type_id == null ) {
  res.status(400).send("'employee_id', 'entitled_days', 'entitled_rollover', 'leave_type_id' are required.", )
  return;
  }

  try {
    const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight})
    const currLeaveAccount = await LeaveAccount.findOne({ where: { employee_id: employee.id, leave_type_id }, include: LeaveType})
    
    if (currLeaveAccount == null) {
      res.status(400).send("Leave account of leave type for employee cannot be found.");
      return;
    };
    
    const leaveAccount = await LeaveAccount.update(
      { entitled_days, entitled_rollover },
      { where: { employee_id, leave_type_id} }
    );

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (leaveAccount[0] === 0) {
      res.status(400).send(`Leave Account is not found for employee ${employee.name}.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} updated ${employee.name}'s Leave Account record`, 
      });

      res.send(currLeaveAccount.id);
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

// manage leave application (approve/reject/cancel)
router.put('/manageLeaveApplication', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { leave_application_id, leave_status_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (leave_application_id == null || leave_status_id == null) {
    res.status(400).send("'leave_application_id' and 'leave_status_id' are required.", )
    return;
  }

  try {
    const curr_leave_application = await sequelize.query(
      'SELECT e.name, leaveApp.id , leaveApp.leave_status_id ' + 
      'FROM leave_applications leaveApp, leave_accounts leaveAcc, employees e ' +
      'WHERE leaveApp.leave_account_id = leaveAcc.id AND leaveAcc.employee_id = e.id ' + 
      `AND leaveApp.id::text = '${leave_application_id}'`,
      { raw: true, 
        type: sequelize.QueryTypes.SELECT}
    );
    console.log(curr_leave_application[0].leave_status_id)
    // const curr_leave_application = await LeaveApplication.findOne({ where: { id: leave_application_id }, include: LeaveStatus})
    if (curr_leave_application[0].leave_status_id !== 1 ) {
      res.status(400).send("Leave status has already been approved/rejected/cancelled.");
      return;
    }

    const leave_application = await LeaveApplication.update(
      { leave_status_id},
      { where: {id: curr_leave_application[0].id}}
    )

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (leave_application[0] === 0) {
      res.status(400).send(`Leave Application id ${leave_application.id} not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} approved/rejected ${curr_leave_application[0].name}'s leave application`, 
      });

      res.send(leave_application_id);
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

// delete leave application -> set status to cancelled
router.delete('/', requireAccess(ViewType.HRM, true), async function(req, res, next) {
  const { leave_application_id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (leave_application_id == null) {
    res.status(400).send("'Leave application id' is required.", )
    return;
  }

  try {
    const leave_application = await LeaveApplication.findByPk(leave_application_id, { include: LeaveStatus });

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (leave_application == null) {
      res.status(400).send(`Leave Application id ${leave_application_id} not found.`)
      
    } else if (leave_application.leave_status_id !== 1) {
      res.status(400).send(`Leave Application has already been approved/rejected/cancelled.`)
    
    } else {
      leave_application.leave_status_id = 4;
      leave_application.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} cancelled leave application record`, 
      });

      res.send(leave_application_id);
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});
module.exports = router;
