const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const LeaveApplication = sequelize.define('leave_application', {

    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      paid: {
        type: DataTypes.BOOLEAN,
        allowNull: false
       
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false
       
      },

      end_date: {
        type: DataTypes.DATE,
        allowNull: false
       
      },

      num_days: {
        type: DataTypes.INTEGER,
        allowNull: false
       
      },

      remarks: {
        type: DataTypes.STRING
       
      }
    },{
        updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
        createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
      });

const LeaveStatus = sequelize.define('leave_status', {
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
  
  module.exports = { LeaveApplication, LeaveStatus };