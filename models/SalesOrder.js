const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const SalesOrder = sequelize.define('sales_order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    gst_rate: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    offset: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    has_gst: DataTypes.INTEGER,
    remarks: DataTypes.STRING,
    closed_on: DataTypes.DATE,
}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});

const SalesOrderItem = sequelize.define('sales_order_item', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    unit_price: {
        type: DataTypes.DECIMAL,
    },
}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});
  

module.exports = { SalesOrder, SalesOrderItem };