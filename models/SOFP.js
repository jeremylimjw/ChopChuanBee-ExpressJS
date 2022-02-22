const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const SOFP = sequelize.define('sofp', {

    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cash_sales_of_goods: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    cash_others: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    account_receivable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    inventory: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    supplies: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    prepaid_insurance: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    prepaid_rent: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_current_asset_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_current_asset_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    land: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_accumulated_depreciation_land: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    building: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_accumulated_depreciation_building: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    equipments: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_accumulated_depreciation_equipments: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_non_current_asset_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_non_current_asset_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    goodwill: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    trade_names: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_intangible_asset_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_intangible_asset_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    account_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    salary_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    interest_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    taxes_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    warrent_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    rental_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    notes_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    bonds_payable: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_libility_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_libility_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    share_capital: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    less_withdrawal: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    retained_earning: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_equity_1: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    other_equity_2: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_date: DataTypes.DATE,
    }, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
  });

  module.exports =  SOFP ;