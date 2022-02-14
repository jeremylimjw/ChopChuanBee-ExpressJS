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

//sofp statement of financial position 
router.get('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { date , id } = req.query;
    
     const account_receivable = await sequelize.query(
        `SELECT sum(amount) as AR
        FROM payments
        WHERE accounting_type_id = 1 
        AND created_at <= '${date}'`,
        { 
            raw: true, 
            type: sequelize.QueryTypes.SELECT 
        }
    );
    const account_payable = await sequelize.query(
        `SELECT sum(amount) as AP
        FROM payments
        WHERE accounting_type_id = 2 
        AND created_at <= '${date}'`,
        { 
          raw: true, 
          type: sequelize.QueryTypes.SELECT 
        }
      );

      const cash_business = await sequelize.query(
        `SELECT sum(amount) as cash_business
        FROM payments
        WHERE payment_method_id IS NOT NULL  
        AND created_at <= '${date}'
        `,
        { 
          raw: true, 
          type: sequelize.QueryTypes.SELECT 
        }
      );


      const inventory_at_hand  = await sequelize.query(
        `SELECT sum(qty_unitcost.total) as inv_at_hand
        FROM (select (quantity * unit_cost) as total, created_at FROM inventory_movements) qty_unitcost
        WHERE created_at <= '${date}'
        `,
        { 
          raw: true, 
          type: sequelize.QueryTypes.SELECT 
        }
      );
     
      console.log(account_receivable);
      res.send({account_receivable, account_payable, cash_business,inventory_at_hand });

});

//incomeStatement  
router.get('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { start_date , end_date } = req.query;
    //const newStart_date = new Date(start_date).toISOString();
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
     

      const created_at = await sequelize.query(
        `SELECT created_at
        FROM payments
        WHERE movement_type_id = 1
        order by created_at desc
        limit 1`,
        { 
          raw: true, 
          type: sequelize.QueryTypes.SELECT 
        }
      );
      //console.log("ISO : "+newStart_date);
      //console.log("normal start date : "+start_date);
      console.log(created_at);

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
        
      res.send({COGS, revenue, customer_sales_return});
});

//SOFP
router.post('/sofp', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const {name, cash_others, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, salary_payable, interest_payable, taxes_payable, warrent_payable, rental_payable, notes_payable, bonds_payable, other_libility_1, other_libility_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2, end_date } = req.body;    
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
          //console.log(cash_business);
          console.log(ar);
          const newSOFP = await SOFP.create({name,cash_sales_of_goods:cash_business, cash_others, account_receivable:ar, inventory:inv_at_hand, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, account_payable:ap, salary_payable, interest_payable, taxes_payable, warrent_payable, rental_payable, notes_payable, bonds_payable, other_libility_1, other_libility_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2, end_date });


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
    const {name, less_customer_sales, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset, start_date, end_date} = req.body;
    
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
        console.log(typeof(customer_sales_return_converted));
        const newIncomeStatement = await IncomeStatement.create({name,revenue:revenue_converted, less_cost_of_goods_sold:COGS_converted, less_customer_sales, retun:customer_sales_return_converted, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset, start_date, end_date });
        
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
    const { id, name,cash_sales_of_goods, cash_others, account_receivable, inventory, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, salary_payable, interest_payable, taxes_payable, warrent_payable, rental_payable, notes_payable, bonds_payable, other_libility_1, other_libility_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2} = req.body;
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null ||name == null || cash_sales_of_goods == null 
        || cash_others == null || account_receivable == null 
        || inventory == null || supplies == null 
        || prepaid_insurance == null || prepaid_rent == null 
        || other_current_asset_1 == null || other_current_asset_2 == null 
        || land == null || less_accumulated_depreciation_land == null 
        || building == null || less_accumulated_depreciation_building == null
        || equipments == null || less_accumulated_depreciation_equipments == null
        || other_non_current_asset_1 == null || other_non_current_asset_2 == null
        || goodwill == null || trade_names == null || other_intangible_asset_1 == null 
        || other_intangible_asset_2 == null || salary_payable == null || interest_payable == null
        || taxes_payable == null || warrent_payable == null || rental_payable == null 
        || notes_payable == null || bonds_payable == null || other_libility_1 == null 
        || other_libility_2 == null || share_capital == null || less_withdrawal == null 
        || retained_earning == null || other_equity_1 == null || other_equity_2 == null || end_date == null) {
      res.status(400).send(" 'id' 'name', 'cash_sales_of_goods', 'cash_others', 'account_receivable', 'inventory', 'supplies', 'prepaid_insurance', 'prepaid_rent', 'other_current_asset_1', 'other_current_asset_2', 'land', 'less_accumulated_depreciation_land', 'building', 'less_accumulated_depreciation_building', 'equipments', 'less_accumulated_depreciation_equipments', 'other_non_current_asset_1', 'other_non_current_asset_2', 'goodwill', 'trade_names', 'other_intangible_asset_1', 'other_intangible_asset_2', 'salary_payable', 'interest_payable', 'taxes_payable', 'warrent_payable', 'rental_payable', 'notes_payable', 'bonds_payable', 'other_libility_1', 'other_libility_2', 'share_capital', 'less_withdrawal', 'retained_earning', 'other_equity_1', 'other_equity_2', 'end_date' are required.", )
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
  
    // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
    if (id == null ||name == null || revenue == null 
        || less_cost_of_goods_sold == null || less_customer_sales == null 
        || retun == null || gain_on_sale_of_asset == null 
        || other_income_1 == null || other_income_2 == null 
        || damaged_inventory == null || salary_expense == null 
        || interest_expense == null 
        || tax_expense == null || warranty_expense == null 
        || rental_expense == null || advertising_expense == null 
        || commissions_expense == null || other_expense_1 == null 
        || other_expense_2 == null || loss_on_sale_of_asset == null 
        || start_date == null || end_date == null) {
      res.status(400).send(" 'name', 'revenue', 'less_cost_of_goods_sold', 'less_customer_sales', 'retun', 'gain_on_sale_of_asset', 'other_income_1', 'other_income_2', 'damaged_inventory', 'salary_expense', 'interest_expense', 'tax_expense', 'warranty_expense', 'rental_expense', 'advertising_expense', 'commissions_expense', 'other_expense_1', 'other_expense_2', 'loss_on_sale_of_asset', 'start_date', 'end_date'  are required.", )
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
//delete sofp 
router.delete('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id } = req.query;
  
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
        sofp.deleted = true;
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



