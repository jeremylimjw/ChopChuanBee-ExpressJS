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

const STANDARD_LEAVE_ACCOUNTS = [
  { entitled_days : 14, leave_type_id : 1 },
  { entitled_days : 0, leave_type_id : 2 },
  { entitled_days : 0, leave_type_id : 3 },
  { entitled_days : 0, leave_type_id : 4 },
  { entitled_days : 0, leave_type_id : 5 },
];
  
module.exports = { LeaveAccount, LeaveType, STANDARD_LEAVE_ACCOUNTS };