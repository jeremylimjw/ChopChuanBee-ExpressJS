const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Log = sequelize.define('logs', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
  createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = Log;