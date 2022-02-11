const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const PurchaseOrder = sequelize.define('purchase_order', {
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
    supplier_invoice_id: DataTypes.STRING,
    remarks: DataTypes.STRING,
    closed_on: DataTypes.DATE,
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const PurchaseOrderItem = sequelize.define('purchase_order_item', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  unit_cost: {
      type: DataTypes.DECIMAL,
  },
  quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
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

const POStatus = sequelize.define('purchase_order_status', {
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


module.exports = { PurchaseOrder, PurchaseOrderItem, PaymentTerm, POStatus };
