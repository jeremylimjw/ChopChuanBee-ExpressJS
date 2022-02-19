const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const AccessRight = sequelize.define('access_right', {
    has_write_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { AccessRight };