var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { LeaveAccount } = require('../models/LeaveAccount');
const { Employee } = require('../models/Employee');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { sequelize } = require('../db');
const { assertNotNull } = require('../common/helpers');


// GET leave balance
// Return all leave accounts for the employee, or return one leave account if `leave_account_id` is given
// Roles access: Only employee can request their own, or HR role, or Admin
router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const { employee_id, leave_account_id } = req.query;
  
  try {
    const currentBalances = await sequelize.query(
      `SELECT leave_accounts.id, leave_accounts.entitled_days, entitled_days - COALESCE(SUM(num_days), 0) AS balance, employee_id, leave_types.name leave_type_name, leave_types.id leave_type_id
        FROM leave_accounts LEFT OUTER JOIN 
          (SELECT * FROM leave_applications WHERE leave_status_id = 2 AND EXTRACT(year FROM start_date) = EXTRACT(year FROM CURRENT_DATE) ) active_leave_applications
          ON active_leave_applications.leave_account_id = leave_accounts.id 
          LEFT JOIN leave_types ON leave_accounts.leave_type_id = leave_types.id
        WHERE TRUE
          ${employee_id == null ? '' : `AND employee_id = '${employee_id}'`}
          ${leave_account_id == null ? '' : `AND leave_accounts.id = '${leave_account_id}'`}
        GROUP BY leave_accounts.id, leave_types.id
        ORDER BY leave_type_id`,
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

// PUT Edit Leave Account
router.put('/', requireAccess(ViewType.HR, true), async function(req, res, next) {
  const { leave_accounts } = req.body;
    
  try {
    assertNotNull(req.body, ['leave_accounts'])
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


    // Get employee
    const leaveAccount = await LeaveAccount.findByPk(leave_accounts[0].id, { include: Employee });

    // Upsert the access right
    for (let account of leave_accounts) {
      await LeaveAccount.update(
        { entitled_days: account.entitled_days },
        { where: { id: account.id } }
      );
    }

    // Record in admin logs
    const user = res.locals.user;
    await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.HR.id,
        text: `${user.name} updated ${leaveAccount.employee.name}'s Leave Account record`, 
    });
    
    res.send({ id: leaveAccount.employee.name });

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


module.exports = router;
