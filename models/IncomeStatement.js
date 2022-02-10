const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const IncomeStatement = sequelize.define('income_statement', { 

    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    revenue: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_cost_of_goods_sold: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_customer_sales: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    retun: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    gain_on_sale_of_asset: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_income_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_income_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    damaged_inventory: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    salary_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    interest_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    tax_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    warranty_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    rental_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    advertising_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    commissions_expense: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_expense_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_expense_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    loss_on_sale_of_asset: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    }
});
module.exports = { IncomeStatement };