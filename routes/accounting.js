var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const SOFP = require('../models/SOFP');
const IncomeStatement = require('../models/IncomeStatement');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../db');
const { parseRequest, assertNotNull } = require('../common/helpers');

//sofp get
router.get('/SOFP', requireAccess(ViewType.ACCOUNTING, false), async function(req, res, next) {
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

//SOFP post
router.post('/sofp', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
  const {name,end_date , remarks } = req.body;
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
        const newSOFP = await SOFP.create({name,cash_sales_of_goods:cash_business, account_receivable:ar, inventory:inv_at_hand,account_payable:ap, end_date ,remarks});
    
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

//SOFP PUT
router.put('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
  const { id, name,cash_sales_of_goods, cash_others, account_receivable, inventory, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2, account_payable, salary_payable, interest_payable, taxes_payable, warranty_payable, rental_payable, notes_payable, bonds_payable, other_current_liability_1, other_current_liability_2, other_non_current_liability_1, other_non_current_liability_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2,end_date , remarks} = req.body;


  try {
    assertNotNull(req.body, ['id', 'name', 'cash_sales_of_goods', 'cash_others', 
                              'account_receivable', 'inventory', 'supplies', 'prepaid_insurance', 
                              'prepaid_rent', 'other_current_asset_1', 'other_current_asset_2', 
                              'land', 'less_accumulated_depreciation_land', 'building', 
                              'less_accumulated_depreciation_building', 'equipments', 
                              'less_accumulated_depreciation_equipments', 'other_non_current_asset_1', 
                              'other_non_current_asset_2', 'goodwill', 'trade_names', 
                              'other_intangible_asset_1', 'other_intangible_asset_2', 'account_payable', 'salary_payable', 
                              'interest_payable', 'taxes_payable', 'warranty_payable', 'rental_payable', 
                              'notes_payable', 'bonds_payable', 'other_current_liability_1', 'other_current_liability_2','other_non_current_liability_1','other_non_current_liability_2',
                              'share_capital', 'less_withdrawal', 'retained_earning', 'other_equity_1', 
                              'other_equity_2', 'end_date'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }


  try {
    const result = await SOFP.update(
      { name, cash_sales_of_goods, cash_others, account_receivable, inventory, supplies, prepaid_insurance, prepaid_rent, other_current_asset_1,other_current_asset_2, land, less_accumulated_depreciation_land, building, less_accumulated_depreciation_building, equipments, less_accumulated_depreciation_equipments, other_non_current_asset_1, other_non_current_asset_2, goodwill, trade_names, other_intangible_asset_1, other_intangible_asset_2,account_payable, salary_payable, interest_payable, taxes_payable, warranty_payable, rental_payable, notes_payable, bonds_payable, other_current_liability_1, other_current_liability_2,other_non_current_liability_1, other_non_current_liability_2, share_capital, less_withdrawal, retained_earning, other_equity_1, other_equity_2, end_date , remarks },
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

//deactivate sofp 
router.post('/SOFP/deactivate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
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

      res.send({ id: sofp.id, deleted_date: sofp.deleted_date});
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});
//activate SOFP
router.post('/SOFP/activate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
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

      res.send({ id: sofp.id, deleted_date: null });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});



//incomeStatement  
router.get('/income_statement', requireAccess(ViewType.ACCOUNTING, false), async function(req, res, next) {
    
    const {name,start_date,end_date, id , status } = req.query;
    let queryString ='';
   
    if (status == null) {
      queryString  = `WITH IC AS (SELECT * FROM income_statements) `
    }
    else if (status == 2){
      queryString  = `WITH IC AS(SELECT * FROM income_statements WHERE deleted_date IS NOT NULL) `
    }
    else if (status == 1) {
      queryString  = `WITH IC AS (SELECT * FROM income_statements WHERE deleted_date IS NULL) `
    }
    if(name != null && start_date != null && end_date != null ){
      queryString += `SELECT * FROM IC WHERE name like '%${name}%' AND (end_date >= '${start_date}' AND end_date <= '${end_date}') OR (start_date >= '${start_date}' AND start_date <= '${end_date}')`
    }                                                   
    else if (name != null ){
      queryString += `SELECT * FROM IC WHERE name like '%${name}%'`
    }
    else if (start_date != null && end_date != null ){
      queryString += `SELECT * FROM IC WHERE (end_date >= '${start_date}' AND end_date <= '${end_date}') OR (start_date >= '${start_date}' AND start_date <= '${end_date}')`
    }
    else if (id != null){
      queryString += `SELECT * FROM IC WHERE ( id ='${id}')`
    }
    else 
    {
      queryString += `SELECT * FROM IC`
    }
    queryString += ` ORDER BY created_at desc`

    const income_statement = await sequelize.query(
      queryString,
      { 
        raw: true, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
  
    try {
      
      res.send(income_statement);
      
    } catch(err) {
      console.log(err);
      res.status(500).send(err);
    }
});



//create income statement 
router.post('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const {name, start_date, end_date , remarks} = req.body;
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
            `SELECT (sum(qty_unitcost.total)*-1) as cost_of_goods_sold
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
            `SELECT sum(qty_unitcost.total *-1) as sales
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
        
        const newIncomeStatement = await IncomeStatement.create({name,revenue:revenue_converted, less_cost_of_goods_sold:COGS_converted, less_customer_sales_return:customer_sales_return_converted,  start_date, end_date , remarks});
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

//income statement PUT
router.put('/income_statement', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { id, name, revenue, less_cost_of_goods_sold, less_customer_sales_return, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset, start_date, end_date,remarks} = req.body;
    try {
      assertNotNull(req.body, ['name', 'revenue', 'less_cost_of_goods_sold', 
                                'less_customer_sales_return', 'gain_on_sale_of_asset', 
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
        { name,revenue, less_cost_of_goods_sold, less_customer_sales_return, gain_on_sale_of_asset, other_income_1, other_income_2, damaged_inventory,salary_expense, interest_expense, tax_expense, warranty_expense, rental_expense, advertising_expense, commissions_expense, other_expense_1, other_expense_2, loss_on_sale_of_asset, start_date, end_date,remarks},
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


//deactivate income statement 
router.post('/income_statement/deactivate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
  const { id } = req.body;

  // Attribute validation here. You can go as deep as type validation but this here is the minimal validation
  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const income_statement = await IncomeStatement.findByPk(id);

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (income_statement == null) {
      res.status(400).send(`Income Statement id ${id} not found.`)

    } else {
      income_statement.deleted_date = new Date();
      income_statement.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ACCOUNTING.id,
        text: `${user.name} deleted ${income_statement.name}`, 
      });

      res.send({ id: income_statement.id, deleted_date: income_statement.deleted_date});
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});
//activate income statement
router.post('/income_statement/activate', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const income_statement = await IncomeStatement.findByPk(id);

    if (income_statement == null) {
      res.status(400).send(`income statement id ${id} not found.`)

    } else {
      income_statement.deleted_date = null;
      income_statement.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `$${user.name} reactivated  ${income_statement.name}`, 
      });

      res.send({ id: income_statement.id, deleted_date: null });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.get('/input_tax', requireAccess(ViewType.ACCOUNTING, false), async function(req, res, next) {

  const {start_date, end_date , charged_under_id } = req.query;

  const input_tax = await sequelize.query(
      `SELECT subquery.id as order_id, c.id as customer_id, c.company_name, cu.name as charged_under_name, subquery.created_at as transaction_date, ((total*(1+subquery.gst_rate/100))+subquery.offset) AS total_transaction_amount, (subquery.gst_rate) AS gst_rate, ((subquery.gst_rate/100)*((total*(1+subquery.gst_rate/100))+subquery.offset)/(1+subquery.gst_rate/100)) AS gst_amount  
      FROM ( 
          SELECT so.id, so.created_at, so.customer_id, SUM(si.unit_price * si.quantity) AS total, MIN(so.gst_rate) AS gst_rate, MIN(so.offset) AS offset 
          FROM sales_orders so JOIN sales_order_items si ON so.id = si.sales_order_id  
          GROUP BY so.id   
      ) AS subquery JOIN customers c ON subquery.customer_id = c.id  
       JOIN charged_unders cu ON c.charged_under_id = cu.id
       WHERE  subquery.created_at BETWEEN '${start_date}' AND '${end_date}'
       AND cu.id = '${charged_under_id}'
       AND subquery.gst_rate > 0
       `,
    { 
      raw: true, 
      type: sequelize.QueryTypes.SELECT 
    }
  );
  let total_amount = input_tax.map(input_tax => input_tax.total_transaction_amount).reduce((amt1,amt2) => (+amt1) + (+amt2), 0);
  total_amount = Math.floor(total_amount*100)/100 
  const total_amount_obj = {total_amount};
  let total_tax = input_tax.map(input_tax => input_tax.gst_amount).reduce((amt1,amt2) => (+amt1) + (+amt2), 0);
  total_amount = Math.floor(total_tax*100)/100 
  const total_input_tax_obj = {total_tax};
  input_tax.push(total_amount_obj);
  input_tax.push(total_input_tax_obj);

  try {

    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ACCOUNTING.id,
      text: `${user.name} generated a Input Tax.`, 
    });

    res.send(input_tax);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

router.get('/output_tax', requireAccess(ViewType.ACCOUNTING, false), async function(req, res, next) {

  const {start_date,end_date, charged_under_id } = req.query;

  const output_tax = await sequelize.query(
      `SELECT subquery.id as order_id, subquery.supplier_id as supplier_id, cu.name as charged_under_name, s.company_name, subquery.created_at as transaction_date, ((total*(1+subquery.gst_rate/100))+subquery.offset) AS total_transaction_amount, (subquery.gst_rate) AS gst_rate, ((subquery.gst_rate/100)*((total*(1+subquery.gst_rate/100))+subquery.offset)/(1+subquery.gst_rate/100)) AS gst_amount  
      FROM ( 
          SELECT po.id,po.charged_under_id, po.created_at, po.supplier_id, SUM(pi.unit_cost * pi.quantity) AS total, MIN(po.gst_rate) AS gst_rate, MIN(po.offset) AS offset 
          FROM purchase_orders po JOIN purchase_order_items pi ON po.id = pi.purchase_order_id  
          GROUP BY po.id   
      ) AS subquery JOIN suppliers s ON subquery.supplier_id = s.id  
      JOIN charged_unders cu ON subquery.charged_under_id = cu.id
       WHERE subquery.created_at BETWEEN '${start_date}' AND '${end_date}'
       AND cu.id = '${charged_under_id}'
       AND subquery.gst_rate > 0`,
    { 
      raw: true, 
      type: sequelize.QueryTypes.SELECT 
    }
  );
  let total_amount = output_tax.map(output_tax => output_tax.total_transaction_amount).reduce((amt1,amt2) => (+amt1) + (+amt2), 0);
  total_amount = Math.floor(total_amount*100)/100 
  const total_amount_obj = {total_amount};
  let total_tax = output_tax.map(output_tax => output_tax.gst_amount).reduce((amt1,amt2) => (+amt1) + (+amt2), 0);
  total_amount = Math.floor(total_tax*100)/100 
  const total_output_tax_obj = {total_tax};
  output_tax.push(total_amount_obj);
  output_tax.push(total_output_tax_obj);

  try {
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ACCOUNTING.id,
      text: `${user.name} generated a Output Tax.`, 
    });

    res.send(output_tax);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});



module.exports = router; 



