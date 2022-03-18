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
            `SELECT to_char(created_at, 'YYYY-MM') AS date, SUM(qty_unitcost.total) AS value
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
          `SELECT to_char(created_at, 'YYYY-MM') AS date, SUM(qty_unitprice.total) AS value
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
            SELECT revenue.date AS date, revenue.rev + cost.cost_of_goods_sold AS value
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
  const {start_date ,end_date,customer_id } = req.query;

  try {
      const profitsTable = await sequelize.query(
          `WITH
          invoiceProfits
          AS
          (
              SELECT
                  SUM(ims.rev) AS revenue,
                  SUM(ims.cogs) AS cost_of_goods_sold,
                  sales_order_item_id
              FROM
                  (
                          SELECT (quantity*unit_price*-1) AS rev,
                      (quantity * unit_cost) AS cogs,
                      created_at, sales_order_item_id,
                      movement_type_id
                  FROM inventory_movements
                      ) ims
              WHERE movement_type_id = 2
              GROUP BY sales_order_item_id
          )
      SELECT
          so.id AS sales_order_id,
          c.id,
          invoiceProfits.revenue AS total_revenue,
          invoiceProfits.cost_of_goods_sold*-1 AS total_COGS,
          invoiceProfits.revenue +  invoiceProfits.cost_of_goods_sold AS total_profits
      FROM invoiceProfits
          INNER JOIN sales_order_items poitems ON invoiceProfits.sales_order_item_id = poitems.id
          INNER JOIN sales_orders so ON so.id = poitems.sales_order_id
          INNER JOIN customers c ON so.customer_id = c.id
      WHERE c.id ='49cdb879-cea8-4458-b88b-1681a41d51a6';
      
      
      WITH
          invoiceProfits
          AS
          (
              SELECT
                  SUM(ims.rev) AS revenue,
                  SUM(ims.cogs) AS cost_of_goods_sold,
                  sales_order_item_id
              FROM
                  (
                           SELECT (quantity*unit_price*-1) AS rev,
                      (quantity * unit_cost) AS cogs,
                      created_at, sales_order_item_id,
                      movement_type_id
                  FROM inventory_movements
                      ) ims
              WHERE movement_type_id = 2
                  AND created_at::DATE >= '${start_date}'
                  AND created_at::DATE <= '${end_date}'
              GROUP BY sales_order_item_id
          )
      SELECT
          so.id AS sales_order_id,
          c.id,
          c.company_name,
          c.p1_name,
          invoiceProfits.revenue AS total_revenue,
          invoiceProfits.cost_of_goods_sold*-1 AS total_COGS,
          invoiceProfits.revenue +  invoiceProfits.cost_of_goods_sold AS total_profits
      FROM invoiceProfits
          INNER JOIN sales_order_items poitems ON invoiceProfits.sales_order_item_id = poitems.id
          INNER JOIN sales_orders so ON so.id = poitems.sales_order_id
          INNER JOIN customers c ON so.customer_id = c.id
      WHERE c.id = '${customer_id}';`,
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


// 3. Product Analytics
// returns all the products
router.get('/Product_Analytics', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const productAnalytics = await sequelize.query(
          `WITH
          start_inventory_table
          AS
          (
              SELECT id, name, sum(qty_unitcost.total) as start_inv_at_hand
              FROM (
              SELECT pdt.id, pdt.name, (ims.quantity * ims.unit_cost) AS total
                  FROM inventory_movements ims INNER JOIN purchase_order_items poitems ON ims.purchase_order_item_id = poitems.id
                      INNER JOIN products pdt ON poitems.product_id = pdt.id
                      WHERE ims.created_at::DATE <= '${start_date}' 
              ) qty_unitcost
              GROUP BY id, name
          ),
          end_inventory_table
          AS
          (
              SELECT id, name, sum(qty_unitcost.total) as end_inv_at_hand
              FROM (
              SELECT pdt.id, pdt.name, (ims.quantity * ims.unit_cost) AS total
                  FROM inventory_movements ims INNER JOIN purchase_order_items poitems ON ims.purchase_order_item_id = poitems.id
                      INNER JOIN products pdt ON poitems.product_id = pdt.id
                  WHERE ims.created_at <= '${end_date}'
              ) qty_unitcost
              GROUP BY id, name
          ),
          inventory_sub_table
          AS
          (
              SELECT
                  id AS product_id,
                  name AS product_name,
                  SUM(totalPrice*-1) AS total_price,
                  SUM(quantity*-1) AS quantity_sold,
                  SUM(sold_inventory_table.totalCOGS)/SUM(quantity) AS average_cogs,
                  SUM(sold_inventory_table.totalPrice)/SUM(quantity) AS average_selling_price,
                  SUM(sold_inventory_table.totalPrice)/SUM(quantity) - SUM(sold_inventory_table.totalCOGS)/SUM(quantity) AS contribution,
                  (SUM(sold_inventory_table.totalPrice)/SUM(quantity) - SUM(sold_inventory_table.totalCOGS)/SUM(quantity)) * SUM(quantity*-1) AS total_contribution
              FROM ( 
              SELECT
                      (ims.quantity * ims.unit_cost *-1) AS totalCOGS,
                      (ims.quantity * ims.unit_price *-1) AS totalPrice,
                      ims.quantity *-1 AS quantity,
                      ims.created_at,
                      ims.movement_type_id,
                      pdt.id,
                      pdt.name
                  FROM inventory_movements ims
                      INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
                      INNER JOIN products pdt ON soitems.product_id = pdt.id
                  WHERE movement_type_id = 2
                      AND ims.created_at::DATE >= '${start_date}'
                      AND ims.created_at::DATE <= '${end_date}'
          ) sold_inventory_table
              GROUP BY product_id, product_name
          )
      SELECT
          t1.product_name,
          t1.quantity_sold * -1 AS quantity_sold,
          t1.average_cogs,
          t1.average_selling_price,
          t1.contribution,
          t1.total_contribution *-1 AS total_contribution,
          (365*(t1.total_price/t1.quantity_sold) / ((t2.start_inv_at_hand + t3.end_inv_at_hand)/2)) AS inventory_turnaround_period
      FROM inventory_sub_table t1
          LEFT JOIN start_inventory_table t2 ON t1.product_id = t2.id
          LEFT JOIN end_inventory_table t3 ON t3.id = t2.id
          ORDER BY total_contribution DESC; `,
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
        text: `${user.name} viewed the Product Analytics Dashboard`, 
      });
  
      res.send(productAnalytics);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//4. Returned goods for supplier
// returns list of products that have been returned for supplier
router.get('/Supplier_Returned_Goods', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
          SELECT 
            pdt.name,
            SUM(ims.quantity * -1) AS quantity_returned,
            SUM(ims.quantity * ims.unit_cost * -1) AS supplier_returned_goods_total_value
          FROM inventory_movements ims
            INNER JOIN purchase_order_items poitems ON ims.purchase_order_item_id = poitems.id
            INNER JOIN products pdt ON poitems.product_id = pdt.id
          WHERE movement_type_id = 3
            AND ims.created_at::DATE >= '${start_date}'
            AND ims.created_at::DATE <= '${end_date}'
          GROUP BY pdt.id
          ORDER BY supplier_returned_goods_total_value DESC;
      
          `,
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
        text: `${user.name} viewed the Returned Goods Dashboard`, 
      });
  
      res.send(returned_goods);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//4. Returned goods for customer
// returns list of products that have been returned for customer
router.get('/Customer_Returned_Goods', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
          SELECT 
            pdt.name,
            SUM(ims.quantity) AS quantity_returned,
            SUM(ims.quantity * ims.unit_cost) AS customer_returned_goods_total_value
          FROM inventory_movements ims
            INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
            INNER JOIN products pdt ON soitems.product_id = pdt.id
          WHERE movement_type_id = 3
            AND ims.created_at::DATE >= '${start_date}'
            AND ims.created_at::DATE <= '${end_date}'
          GROUP BY pdt.id
          ORDER BY customer_returned_goods_total_value DESC;
      
          `,
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
        text: `${user.name} viewed the Customer Returned Goods Dashboard`, 
      });
  
      res.send(returned_goods);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//4. Damaged Inventory
// returns list of products that have been damaged  
router.get('/Damaged_Goods', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const damaged_goods = await sequelize.query(
          `
          SELECT
          pdt.name,
          SUM(ims.quantity * -1) AS quantity_returned,
          SUM(ims.quantity * ims.unit_cost * -1) AS total_damaged_inventory_value
          FROM inventory_movements ims
          INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
          INNER JOIN products pdt ON soitems.product_id = pdt.id
          WHERE movement_type_id = 4
          AND ims.created_at::DATE >= '${start_date}'
          AND ims.created_at::DATE <= '${end_date}'
          GROUP BY pdt.id
          ORDER BY total_damaged_inventory_value DESC;
      
          `,
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
        text: `${user.name} viewed the Damaged Goods Dashboard`, 
      });
  
      res.send(damaged_goods);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//5. Payments Dashboard: Unsettled AR -- customer level
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


//5. Payments Dashboard: Unsettled AP -- supplier level
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


//5. Payments Dashboard: Unsettled AP -- invoice level
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

//5. Payments Dashboard: Unsettled AR -- invoice level
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


//6. AR Table for Demo
// returns list of customers 
router.get('/Aging_AR_Table_Demo', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
  try {
      const AR_table = await sequelize.query(
          `
           WITH
              AR_Aging_Table
              AS
              (
                  SELECT
                      cust.id AS customer_id,
                      cust.company_name AS company_name,
                      cust.p1_name AS p1_name,
                      SUM(pmt.amount*-1) AS amount_due,
                      so.created_at AS created_date,
                      so.id AS invoice_id
                  FROM
                      payments pmt INNER JOIN sales_orders so ON pmt.sales_order_id = so.id
                      INNER JOIN customers cust ON  so.customer_id = cust.id
                  WHERE pmt.accounting_type_id = 2
                  GROUP BY  cust.id, so.id, company_name, p1_name
          
              )
          SELECT customer_id, company_name, p1_name, SUM(a) AS over_less_than_60, SUM(b) AS overdue_61_to_180_days, SUM(c) AS  overdue_181_to_270_days, SUM(d) AS overdue_more_than_271_days
          FROM (
              SELECT customer_id, company_name, p1_name, invoice_id, 
                  DATE_PART('day', '2021-12-31' - created_date) AS days_past_due,
                  SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) <= 60 THEN amount_due ELSE 0 END) AS a,
                  SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) BETWEEN 61 AND 180 THEN amount_due ELSE 0 END) AS b,
                  SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) BETWEEN 181 AND 270 THEN amount_due ELSE 0 END) AS c,
                  SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) >= 271 THEN amount_due ELSE 0 END) AS d
              FROM AR_Aging_Table
              GROUP BY customer_id, invoice_id, created_date, company_name, p1_name
          ) AS AR_table
          GROUP BY customer_id, company_name, p1_name;
          `,
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
        text: `${user.name} viewed the AR Aging Table (Demo Version) `, 
      });
      res.send(AR_table)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});



//6. AR Table 
// returns list of customers 
router.get('/Aging_AR_Table', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
  try {
      const AR_table = await sequelize.query(
          `
          WITH
          AR_Aging_Table
          AS
          (
              SELECT
                  cust.id AS customer_id,
                  cust.company_name AS company_name,
                  cust.p1_name AS p1_name,
                  SUM(pmt.amount*-1) AS amount_due,
                  so.created_at AS created_date,
                  so.id AS invoice_id
              FROM
                  payments pmt INNER JOIN sales_orders so ON pmt.sales_order_id = so.id
                  INNER JOIN customers cust ON  so.customer_id = cust.id
              WHERE pmt.accounting_type_id = 2
              GROUP BY  cust.id, so.id, company_name, p1_name
      
          )
      SELECT customer_id, company_name, p1_name, SUM(a) AS over_less_than_60, SUM(b) AS overdue_61_to_180_days, SUM(c) AS  overdue_181_to_270_days, SUM(d) AS overdue_more_than_271_days
      FROM (
          SELECT customer_id, company_name, p1_name, invoice_id, 
              DATE_PART('day', CURRENT_TIMESTAMP - created_date) AS days_past_due,
              SUM(CASE WHEN DATE_PART('day', CURRENT_TIMESTAMP - created_date) <= 30 THEN amount_due ELSE 0 END) AS a,
              SUM(CASE WHEN DATE_PART('day', CURRENT_TIMESTAMP - created_date) BETWEEN 31 AND 60 THEN amount_due ELSE 0 END) AS b,
              SUM(CASE WHEN DATE_PART('day', CURRENT_TIMESTAMP - created_date) BETWEEN 61 AND 90 THEN amount_due ELSE 0 END) AS c,
              SUM(CASE WHEN DATE_PART('day', CURRENT_TIMESTAMP - created_date) >= 91 THEN amount_due ELSE 0 END) AS d
          FROM AR_Aging_Table
          GROUP BY customer_id, invoice_id, created_date, company_name, p1_name
      ) AS AR_table
      GROUP BY customer_id, company_name, p1_name;
          `,
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
        text: `${user.name} viewed the AR Aging Table (Demo Version) `, 
      });
      res.send(AR_table)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


module.exports = router; 
