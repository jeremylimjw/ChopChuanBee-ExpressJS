const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const DeliveryOrder = sequelize.define('delivery_order', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
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
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    deliver_by: {
        type: DataTypes.DATE,
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