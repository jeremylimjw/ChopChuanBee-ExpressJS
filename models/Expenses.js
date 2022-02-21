const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Expenses = sequelize.define('expenses', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
    },
    incurred_on: {
        type: DataTypes.DATE,
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});
const ExpensesType = sequelize.define('expenses_type', {
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
  
module.exports = {Expenses, ExpensesType};