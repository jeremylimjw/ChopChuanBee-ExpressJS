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
  gst_show: DataTypes.BOOLEAN,
  deactivated_date: DataTypes.DATE,
  description: DataTypes.STRING,
  company_email: DataTypes.STRING,
  p2_name: DataTypes.STRING,
  p2_phone_number: DataTypes.STRING,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const ChargedUnder = sequelize.define('charged_under', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gst_rate: {
    type: DataTypes.DECIMAL,
    defaultValue: 0,
  },
  address: DataTypes.STRING, 
  shipping_address: DataTypes.STRING, 
  contact_number: DataTypes.STRING, 
  registration_number: DataTypes.STRING, 
  deactivated_date: DataTypes.DATE,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const CustomerMenu = sequelize.define('customer_menu', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  product_alias: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  timestamps: false,
});

module.exports = { Customer, CustomerMenu, ChargedUnder };