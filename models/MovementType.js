const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const MovementType = sequelize.define('movement_type', {
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


module.exports = { MovementType };
