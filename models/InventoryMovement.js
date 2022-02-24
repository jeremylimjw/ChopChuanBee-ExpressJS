const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const InventoryMovement = sequelize.define('inventory_movement', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    unit_cost: DataTypes.DECIMAL,
    unit_price: DataTypes.DECIMAL,
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});


module.exports = { InventoryMovement };
