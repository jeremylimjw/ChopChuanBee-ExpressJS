var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');
const SOFP = require('../models/SOFP');
const IncomeStatement = require('../models/IncomeStatement');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../db');
const { parseRequest, assertNotNull } = require('../common/helpers');

//sofp statement of financial position 
router.get('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const predicate = parseRequest(req.query);
  
  try {
    const sofp = await SOFP.findAll(predicate);
    res.send(sofp);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

//incomeStatement  
router.get('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {

    const predicate = parseRequest(req.query);
  
    try {
      const sofp = await IncomeStatement.findAll(predicate);
      res.send(sofp);
      
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
});

//SOFP
router.post('/sofp', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const {name,end_date } = req.body;
    try {

        const account_receivable = await sequelize.query(
            `SELECT sum(amount) as AR
            FROM payments
            WHERE accounting_type_id = 1 
            AND created_at <= '${end_date}'`,
            { 
                raw: true, 
                type: sequelize.QueryTypes.SELECT 
            }
        );
        const account_payable = await sequelize.query(
            `SELECT sum(amount) as AP
            FROM payments
            WHERE accounting_type_id = 2 
            AND created_at <= '${end_date}'`,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
          );
    
          const cash_sales_of_goods = await sequelize.query(
            `SELECT sum(amount) as cash_sales_of_goods
            FROM payments
            WHERE payment_method_id IS NOT NULL  
            AND created_at <= '${end_date}'
            `,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
          );
    
    
          const inventory  = await sequelize.query(
            `SELECT sum(qty_unitcost.total) as inv_at_hand
            FROM (select (quantity * unit_cost) as total, created_at FROM inventory_movements) qty_unitcost
            WHERE created_at <= '${end_date}'
            `,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
          );
         
          const cash_business = parseFloat(cash_sales_of_goods[0].cash_sales_of_goods) || 0;
          const ar = parseFloat(account_receivable[0].ar) || 0;
          const ap = parseFloat(account_payable[0].ap) || 0;
          const inv_at_hand = parseFloat(inventory[0].inv_at_hand) || 0;
          const newSOFP = await SOFP.create({name,cash_sales_of_goods:cash_business, account_receivable:ar, inventory:inv_at_hand,account_payable:ap, end_date });
      
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} created a SOFP record `, 
        });
    
        res.send(newSOFP.toJSON());
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }


});

//create income statement 
router.post('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const {name, start_date, end_date} = req.body;
    try {
        const revenue = await sequelize.query(
            `SELECT sum(qty_unitprice.total) as revenue 
            FROM (select (quantity * unit_price*-1) as total, created_at, movement_type_id FROM inventory_movements) qty_unitprice 
            WHERE movement_type_id = 2
            AND created_at >= '${start_date}'
            AND created_at <= '${end_date}'`,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
          );
    
          const COGS = await sequelize.query(
            `SELECT sum(qty_unitcost.total) as cost_of_goods_sold
            FROM (select (quantity * unit_cost) as total, created_at, movement_type_id FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
            AND created_at >= '${start_date}'
            AND created_at <= '${end_date}'`,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
          );

          const customer_sales_return = await sequelize.query(
            `SELECT sum(qty_unitcost.total) as sales
            FROM (select (quantity * (unit_price - unit_cost)) as total, created_at, movement_type_id FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 3
            AND created_at >= '${start_date}'
            AND created_at <= '${end_date}'`,
            { 
              raw: true, 
              type: sequelize.QueryTypes.SELECT 
            }
        );  
         
        const revenue_converted = parseFloat(revenue[0].revenue)|| 0;
        const COGS_converted = parseFloat(COGS[0].cost_of_goods_sold)|| 0;
        const customer_sales_return_converted = parseFloat(customer_sales_return[0].sales) || 0;
        
        const newIncomeStatement = await IncomeStatement.create({name,revenue:revenue_converted, less_cost_of_goods_sold:COGS_converted, retun:customer_sales_return_converted,  start_date, end_date });
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} created a income statement record `, 
        });
    
        res.send(newIncomeStatement.toJSON());
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }


});
//SOFP PUT
router.put('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id, name,cash_sales_of_goods, cash_others, account_receivable, inventory, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, salary_payable, interest_payable, taxes_payable, warrent_payable, rental_payable, notes_payable, bonds_payable, other_libility_1, other_libility_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2,end_date} = req.body;
  

    try {
      assertNotNull(req.body, ['id', 'name', 'cash_sales_of_goods', 'cash_others', 
                                'account_receivable', 'inventory', 'supplies', 'prepaid_insurance', 
                                'prepaid_rent', 'other_current_asset_1', 'other_current_asset_2', 
                                'land', 'less_accumulated_depreciation_land', 'building', 
                                'less_accumulated_depreciation_building', 'equipments', 
                                'less_accumulated_depreciation_equipments', 'other_non_current_asset_1', 
                                'other_non_current_asset_2', 'goodwill', 'trade_names', 
                                'other_intangible_asset_1', 'other_intangible_asset_2', 'salary_payable', 
                                'interest_payable', 'taxes_payable', 'warrent_payable', 'rental_payable', 
                                'notes_payable', 'bonds_payable', 'other_libility_1', 'other_libility_2', 
                                'share_capital', 'less_withdrawal', 'retained_earning', 'other_equity_1', 
                                'other_equity_2', 'end_date'])
    } catch(err) {
      res.status(400).send(err);
      return;
    }
  
  
    try {
      const result = await SOFP.update(
        { name, cash_sales_of_goods, cash_others, account_receivable, inventory, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, salary_payable, interest_payable, taxes_payable, warrent_payable, rental_payable, notes_payable, bonds_payable, other_libility_1, other_libility_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2, end_date },
        { where: { id : id } }
      );
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (result[0] === 0) {
        res.status(400).send(`SOFP id ${id} not found.`)
  
      } else {
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} updated ${name} SOFP`, 
        });
  
        res.send({ id: id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });
  

//income statement PUT
router.put('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id, name, revenue, less_cost_of_goods_sold, less_customer_sales, retun, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset} = req.body;
    try {
      assertNotNull(req.body, ['name', 'revenue', 'less_cost_of_goods_sold', 
                                'less_customer_sales', 'retun', 'gain_on_sale_of_asset', 
                                'other_income_1', 'other_income_2', 'damaged_inventory', 
                                'salary_expense', 'interest_expense', 'tax_expense', 'warranty_expense', 
                                'rental_expense', 'advertising_expense', 'commissions_expense', 'other_expense_1', 
                                'other_expense_2', 'loss_on_sale_of_asset', 'start_date', 'end_date'])
    } catch(err) {
      res.status(400).send(err);
      return;
    }
 
  
    try {
      const result = await IncomeStatement.update(
        { name,revenue, less_cost_of_goods_sold, less_customer_sales, retun, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset, start_date, end_date},
        { where: { id : id } }
      );
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (result[0] === 0) {
        res.status(400).send(`income statement id ${id} not found.`)
  
      } else {
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} updated ${name} income statement`, 
        });
  
        res.send({ id: id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });
//deactivate sofp 
router.post('/deactivate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id } = req.body;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
    }
  
    try {
      const sofp = await SOFP.findByPk(id);
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (sofp == null) {
        res.status(400).send(`sofp id ${id} not found.`)
  
      } else {
        sofp.deleted_date = new Date();
        sofp.save();
  
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} deleted ${sofp.name}`, 
        });
  
        res.send({ id: sofp.id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });
  //activate SOFP
  router.post('/activate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id } = req.body;
  
    if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
    }
  
    try {
      const sofp = await SOFP.findByPk(id);
  
      if (sofp == null) {
        res.status(400).send(`sofp id ${id} not found.`)
  
      } else {
        sofp.deleted_date = null;
        sofp.save();
  
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.CRM.id,
          text: `$${user.name} reactivated  ${sofp.name}`, 
        });
  
        res.send({ id: sofp.id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });



//delete income_statement 
router.delete('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id } = req.query;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
    }
  
    try {
      const incomeStatement = await IncomeStatement.findByPk(id);
  
      // If 'id' is not found return 400 Bad Request, if found then return the 'id'
      if (incomeStatement == null) {
        res.status(400).send(`income statement id ${id} not found.`)
  
      } else {
        incomeStatement.deleted = true;
        incomeStatement.save();
  
        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ACCOUNTING.id,
          text: `${user.name} deleted ${incomeStatement.name}`, 
        });
  
        res.send({ id: incomeStatement.id });
      }
  
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
  
  });



module.exports = router; 



