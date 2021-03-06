const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Employee = sequelize.define('employee', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: DataTypes.STRING,
  contact_number: DataTypes.STRING,
  nok_name: DataTypes.STRING,
  nok_number: DataTypes.STRING,
  address: DataTypes.STRING,
  postal_code: DataTypes.STRING,
  discharge_date: DataTypes.DATE,
  last_active: DataTypes.DATE,
  activation_token: DataTypes.STRING,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const Role = sequelize.define('role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, { 
  timestamps: false 
});

module.exports = { Employee, Role };