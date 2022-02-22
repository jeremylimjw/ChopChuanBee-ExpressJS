var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { LeaveAccount } = require('../models/LeaveAccount');
const { LeaveApplication, LeaveStatus } = require('../models/LeaveApplication');
const { Employee } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { sequelize } = require('../db');
const LeaveStatusEnum = require('../common/LeaveStatusEnum');
const { Sequelize } = require('sequelize');
const { assertNotNull } = require('../common/helpers');


/**
 * GET all leave applications 
 */
router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { employee_id, employee_name, leave_type_id, leave_status_id } = req.query;

  // Craft the associations to return
  const includeEmployee = { model: Employee, attributes: ['id', 'name'] };

  if (employee_name != null) {
    includeEmployee.where = { name: { [Sequelize.Op.iLike]: `%${employee_name}%` } };
  }

  // Craft the associations to return
  const includeLeaveAccount = { model: LeaveAccount, include: [includeEmployee], where: {} }; 

  if (employee_id != null) {
    includeLeaveAccount.where.employee_id = employee_id;
  }

  if (leave_type_id != null) {
    includeLeaveAccount.where.leave_type_id = leave_type_id;
  }

  const where = {}
  if (leave_status_id != null) {
    where.leave_status_id = leave_status_id;
  }
  
  try {
    const leaveApplications = await LeaveApplication.findAll({ 
      include: [includeLeaveAccount, LeaveStatus],
      order: [['created_at', 'DESC']],
      where: where,
    });
    
    res.send(leaveApplications);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// POST create leave Application
// Roles access: Only employee can request their own leave account, or HR role, or Admin
router.post('/', requireAccess(ViewType.GENERAL), async function(req, res, next) { 
  const { leave_account_id, paid, start_date, end_date, num_days, remarks } = req.body;

  try {
    assertNotNull(req.body, ['leave_account_id', 'paid', 'start_date', 'end_date', 'num_days'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const leaveAccount = await LeaveAccount.findByPk(leave_account_id, { include: Employee });
  
    if (leaveAccount == null) {
        res.status(400).send(`Leave account id ${leave_account_id} not found.`);
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
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.HR.id,
      text: `${user.name} created a Leave Application record for ${leaveAccount.employee.name}`, 
    });

    const newLeaveApplication = await LeaveApplication.findByPk(leaveApplication.id, { 
      include: [{ model: LeaveAccount, include: { model: Employee, attributes: ['id', 'name'] } }] });
    res.send(newLeaveApplication.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});


// PUT Edit leave application (approve/reject)
router.put('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { leave_applications } = req.body;
  
  try {
    assertNotNull(req.body, ['leave_applications'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
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

      // Validate if enough balance if approving
      if (newLeaveStatusId === LeaveStatusEnum.APPROVED.id) {
        const currentBalance = await sequelize.query(
          `SELECT leave_accounts.id, leave_accounts.entitled_days, entitled_days - COALESCE(SUM(num_days), 0) AS balance, leave_types.name leave_type_name, leave_types.id leave_type_id
            FROM leave_accounts LEFT OUTER JOIN 
              (SELECT * FROM leave_applications WHERE leave_status_id = 2 AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) ) active_leave_applications
              ON active_leave_applications.leave_account_id = leave_accounts.id 
              LEFT JOIN leave_types ON leave_accounts.leave_type_id = leave_types.id
            WHERE leave_accounts.id = '${leaveApplication.leave_account_id}'
            GROUP BY leave_accounts.id, leave_types.id`,
           { raw: true, 
           type: sequelize.QueryTypes.SELECT}
        );
  
        if (currentBalance[0]?.balance < leaveApplication.num_days) {
          res.status(400).send(`Employee does not have sufficient balance (left ${currentBalance[0].balance})`,)
          return;
        }
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

module.exports = router;
