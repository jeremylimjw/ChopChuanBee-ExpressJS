const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Supplier = sequelize.define('supplier', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  s1_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  s1_phone_number: {
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

  description: {
    type: DataTypes.STRING,
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  company_email: {
    type: DataTypes.STRING,
  },
  s2_name: DataTypes.STRING,
  s2_phone_number: DataTypes.STRING,
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const SupplierMenu = sequelize.define('supplier_menu', {
}, {
  timestamps: false,
});

const GUEST_ID = '00000000-0000-0000-0000-000000000000';

module.exports = { Supplier, SupplierMenu, GUEST_ID };
