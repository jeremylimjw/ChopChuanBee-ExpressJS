const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Payment = sequelize.define('payment', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  amount: {
      type: DataTypes.DECIMAL,
      allowNull: false,
  },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});

const PaymentMethod = sequelize.define('payment_method', {
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

const AccountingType = sequelize.define('accounting_type', {
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


module.exports = { Payment, PaymentMethod, AccountingType };
