const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

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
      entitled_rollover: {
        type: DataTypes.INTEGER,
        allowNull: false
       
      }
    },{
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
  
  module.exports = { LeaveAccount, LeaveType };