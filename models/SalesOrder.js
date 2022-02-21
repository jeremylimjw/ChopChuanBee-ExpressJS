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
   
    remarks: DataTypes.STRING,
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const PaymentTerm = sequelize.define('payment_term', {
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
      updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
      createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
  });
  

  module.exports = { SalesOrder, PaymentTerm, SalesOrderItem };