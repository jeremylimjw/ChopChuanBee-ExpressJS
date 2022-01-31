var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const {LeaveAccount, LeaveType} = require('../models/LeaveAccount');
const {LeaveApplication, LeaveStatus} = require('../models/LeaveApplication');
const {Employee , Role, AccessRight  } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');



//create leave account
router.post('/', requireAccess(ViewType.HR, true), async function(req, res, next) { 

    const {employee_id, entitled_days, entitled_rollover, leave_type_id } = req.body;

    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (employee_id == null || entitled_days == null 
        || entitled_rollover == null || leave_type_id == null ) {
      res.status(400).send("'employee_id', 'entitled_days', 'entitled_rollover', 'leave_type_id' are required.", )
      return;
    }
  
    try {
        
        
      const employee = await Employee.findOne({ where: { id: employee_id }, include: Role, include : AccessRight})
     const leave_account = await LeaveAccount.create({ entitled_days, entitled_rollover, leave_type_id , employee_id : employee.id});
      //console.log("Employee.id" +employee.id);
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
module.exports = router;
