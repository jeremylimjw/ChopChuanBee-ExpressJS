const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Product = sequelize.define('product', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  min_inventory_level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  deactivated_date: DataTypes.DATE,
  description: DataTypes.STRING,
  unit: DataTypes.STRING,
},{
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { Product };