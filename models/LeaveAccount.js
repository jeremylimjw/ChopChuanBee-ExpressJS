const { DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const { sequelize } = require('../db');
const Log = require('./Log');

const LeaveAccount = sequelize.define('leave_account', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  entitled_days: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const LeaveType = sequelize.define('leave_type', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, { 
  timestamps: false // Dont record 'updatedAt' and 'createdAt'
});



async function validateLeaveAccounts(leave_accounts) {
  if (leave_accounts == null) {
    throw ("'leave_accounts' is required.")
  }

  if (!Array.isArray(leave_accounts)) {
      throw ("'leave_accounts' must be an array.")
  }

  for (let leave_account of leave_accounts) {
      if (leave_account.id == null || leave_account.entitled_days == null) {
          throw (`'leave_accounts' array must be in { id: number, entitled_days: number } format.`);
      }
  }
}

async function updateLeaveAccounts(leave_accounts, employee, user, avoidLogging) {
    // Upsert the access right
    for (let leave_account of leave_accounts) {
        await LeaveAccount.update(
          { entitled_days: leave_account.entitled_days },
          { where: { id: leave_account.id } }
        );

        if (!avoidLogging) {
            // Record in admin logs
            await Log.create({ 
                employee_id: user.id, 
                view_id: ViewType.HR.id,
                text: `${user.name} updated ${employee.name}'s Leave Account record`, 
            });
        }
    }
}

const STANDARD_LEAVE_ACCOUNTS = [
  { entitled_days : 14, leave_type_id : 1 },
  { entitled_days : 0, leave_type_id : 2 },
  { entitled_days : 0, leave_type_id : 3 },
  { entitled_days : 0, leave_type_id : 4 },
  { entitled_days : 0, leave_type_id : 5 },
];
  
module.exports = { LeaveAccount, LeaveType, validateLeaveAccounts, updateLeaveAccounts, STANDARD_LEAVE_ACCOUNTS };