const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const DeliveryOrder = sequelize.define('delivery_order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    deliver_by: {
        type: DataTypes.DATE,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    latitude: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    deliver_at: {
        type: DataTypes.DATE,
    },
    remarks: DataTypes.STRING,
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

module.exports = { DeliveryOrder };