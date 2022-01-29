const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Customer = sequelize.define('customer', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  p1_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  p1_phone_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gst: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  gst_show: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  company_email: DataTypes.STRING,
  p2_name: DataTypes.STRING,
  p2_phone_number: DataTypes.STRING,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const ChargedUnder = sequelize.define('charged_under', {
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

module.exports = { Customer, ChargedUnder };