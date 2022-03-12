var express = require('express');
var router = express.Router();
const { Sequelize } = require('sequelize');
const { sequelize } = require('../db');
const { requireAccess } = require('../auth');
const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { parseRequest, assertNotNull } = require('../common/helpers');


//1. Profits Dashboard: COGS
// returns by selected month
router.get('/COGS_table', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
    const {start_date ,end_date } = req.query;
    try {
        const cogsTable = await sequelize.query(
            `SELECT to_char(created_at, 'YYYY-MM') AS month-year, SUM(qty_unitcost.total) AS COGS
            FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
            AND created_at::DATE >= '${start_date}'
            AND created_at::DATE <= '${end_date}'
            GROUP BY date
            ORDER BY date ASC;`,
            {
                raw: true,
                type: sequelize.QueryTypes.SELECT
            }
        )

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ANALYTICS.id,
          text: `${user.name} viewed the Profits Dashboard (COGS) `, 
        });
    
        res.send(cogsTable);
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//1. Profits Dashboard: Revenue
// returns by selected month
router.get('/Revenue_table', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const revenueTable = await sequelize.query(
          `SELECT to_char(created_at, 'YYYY-MM') AS month-year, SUM(qty_unitprice.total) AS Revenue
          FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id FROM inventory_movements) qty_unitprice
          WHERE movement_type_id = 2
          AND created_at::DATE >= '${start_date}'
          AND created_at::DATE <= '${end_date}'
          GROUP BY date
          ORDER BY date ASC;`,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Profits Dashboard (Revenue) `, 
      });
  
      res.send(revenueTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//1. Profits Dashboard: Profits
// returns by selected months
router.get('/Profits_table', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const profitsTable = await sequelize.query(
          `WITH revenue AS (
            SELECT to_char(created_at, 'YYYY-MM') AS DATE, SUM(qty_unitprice.total) AS rev
            FROM (SELECT (quantity * unit_price*-1) AS total, created_at, movement_type_id FROM inventory_movements) qty_unitprice
            WHERE movement_type_id = 2
            AND created_at::DATE >= '${start_date}'
            AND created_at::DATE <= '${end_date}'
            GROUP BY date
            ORDER BY date ASC
            ), cost AS (
            SELECT to_char(created_at, 'YYYY-MM') AS date, SUM(qty_unitcost.total) as cost_of_goods_sold
            FROM (select (quantity * unit_cost) as total, created_at, movement_type_id FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
            AND created_at::DATE >= '${start_date}'
            AND created_at::DATE <= '${end_date}'
            GROUP BY date
            ORDER BY date ASC
            )
            SELECT revenue.date, revenue.rev + cost.cost_of_goods_sold AS profit
            FROM revenue NATURAL JOIN cost
            ORDER BY date ASC;`,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Profits Dashboard (Profits        ) `, 
      });
  
      res.send(profitsTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//2. Profits for each Customer
// returns all the customers
router.get('/Customer_Profits', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const profitsTable = await sequelize.query(
          `WITH invoiceProfits AS (
            SELECT 
                SUM(ims.rev) AS revenue, 
                SUM(ims.cogs) AS cost_of_goods_sold, 
                sales_order_item_id
            FROM 
                (
                    SELECT (quantity*unit_price*-1) AS rev, 
                    (quantity * unit_cost) AS cogs, 
                    created_at, sales_order_item_id, 
                    movement_type_id FROM inventory_movements
                ) ims
            WHERE movement_type_id = 2
                AND created_at::DATE >= '${start_date}'
                AND created_at::DATE <= '${end_date}'
            GROUP BY sales_order_item_id
            )
            SELECT 
                so.id AS sales_order_id, 
                invoiceProfits.revenue AS total_revenue, 
                invoiceProfits.cost_of_goods_sold*-1 AS total_COGS,
                invoiceProfits.revenue +  invoiceProfits.cost_of_goods_sold AS total_profits
            FROM invoiceProfits 
            INNER JOIN sales_order_items poitems ON invoiceProfits.sales_order_item_id = poitems.id
            INNER JOIN sales_orders so ON so.id = poitems.sales_order_id
            INNER JOIN customers c ON so.customer_id = c.id; `,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Profits for each Customer Dashboard`, 
      });
  
      res.send(profitsTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//3. Payments Dashboard: Unsettled AR -- customer level
//returns top 10 customers
router.get('/Customer_AR', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
  try {
      const customer_ar = await sequelize.query(
          `SELECT cust.company_name, cust.p1_name, SUM(pmt.amount) AS total_AR_amount
          FROM 
              payments pmt INNER JOIN sales_orders so ON pmt.sales_order_id = so.id
              INNER JOIN customers cust ON  so.customer_id = cust.id
          WHERE 
              pmt.accounting_type_id = 2 
          GROUP BY cust.id
          ORDER BY total_AR_amount
          LIMIT 10`,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )    

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Unsettled AR Dashboard (Customer Level) `, 
      });
      res.send(customer_ar)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//3. Payments Dashboard: Unsettled AP -- supplier level
// returns top 10 supplier
router.get('/Supplier_AP', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
  try {
      const customer_ar = await sequelize.query(
          `SELECT supp.company_name, supp.s1_name, SUM(pmt.amount) AS total_AP_amount
          FROM 
              payments pmt INNER JOIN purchase_orders pos ON pmt.purchase_order_id = pos.id
              INNER JOIN suppliers supp ON  pos.supplier_id = supp.id
          WHERE 
              pmt.accounting_type_id = 1 
          GROUP BY supp.id
          ORDER BY total_AP_amount DESC
          LIMIT 10`,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )    

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Unsettled AR Dashboard (Customer Level) `, 
      });
      res.send(customer_ar)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//3. Payments Dashboard: Unsettled AP -- invoice level
// returns top 10 invoice
router.get('/Unsettled_AP', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
    try {
        const unsettled_AP = await sequelize.query(
            `SELECT pos.id, pos.supplier_invoice_id, SUM(pmt.amount) 
            FROM payments pmt INNER JOIN purchase_orders pos ON pmt.purchase_order_id = pos.id
            WHERE pmt.accounting_type_id = 1 
            GROUP BY pos.id
            ORDER BY SUM(pmt.amount) DESC
            LIMIT 10`,
            {
                raw: true,
                type: sequelize.QueryTypes.SELECT
            }
        )    

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ANALYTICS.id,
          text: `${user.name} viewed the Unsettled AP Dashboard (Invoice Level) `, 
        });
        res.send(unsettled_AP)
    
        
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//3. Payments Dashboard: Unsettled AR -- invoice level
// returns top 10 invoice
router.get('/Unsettled_AR', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
  try {
      const unsettled_AR = await sequelize.query(
          `SELECT s.id, SUM(pmt.amount) 
          FROM payments pmt INNER JOIN sales_orders s ON pmt.sales_order_id = s.id
          WHERE pmt.accounting_type_id = 2
          GROUP BY s.id
          ORDER BY SUM(pmt.amount) DESC
          LIMIT 10`,
          {
              raw: true,
              type: sequelize.QueryTypes.SELECT
          }
      )    

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the Unsettled AR Dashboard (Invoice Level) `, 
      });
      res.send(unsettled_AR)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


module.exports = router; 
