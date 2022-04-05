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
            `SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitcost.total*-1),0) AS value
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

//1. Profits Dashboard - Small Card for COGS
// returns by selected month
router.get('/COGS_table_CurrentMonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {

    try {
        const cogsTable = await sequelize.query(
            `SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitcost.total*-1),0) AS value
              FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                  FROM inventory_movements) qty_unitcost
              WHERE movement_type_id = 2
              GROUP BY date
              ORDER BY date DESC
              LIMIT 1;`,
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
          text: `${user.name} viewed the Profits Dashboard (COGS_Current_Month) `, 
        });
    
        res.send(cogsTable);
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//1. Profits Dashboard - Small Card for COGS
// returns by selected month
router.get('/COGS_table_previousmonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {

    try {
        const cogsTable = await sequelize.query(
            `
            SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitcost.total*-1),0) AS value
            FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
            GROUP BY date
            ORDER BY date DESC
            LIMIT 1 OFFSET 1;
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
          text: `${user.name} viewed the Profits Dashboard (COGS_Previous_Month) `, 
        });
    
        res.send(cogsTable);
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//1. Profits Dashboard - Small Card for COGS
// returns by selected month
router.get('/COGS_table_today', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {

    try {
        const cogsTable = await sequelize.query(
            `
            SELECT coalesce(SUM(qty_unitcost.total*-1),0) AS value
            FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
                AND CAST(created_at AS DATE) = CAST(CURRENT_TIMESTAMP AS DATE)
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
          text: `${user.name} viewed the Profits Dashboard (COGS_Today) `, 
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
          `SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.total),0) AS value
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

//1. Profits Dashboard: Revenue
// returns by selected month
router.get('/Revenue_table_currentmonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const revenueTable = await sequelize.query(
          `
          SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.total),0) AS value
          FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
              FROM inventory_movements) qty_unitprice
          WHERE movement_type_id = 2
          GROUP BY date
          ORDER BY date DESC
          LIMIT 1;
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
        text: `${user.name} viewed the Profits Dashboard (Revenue_current month) `, 
      });
  
      res.send(revenueTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//1. Profits Dashboard: Revenue
// returns by selected month
router.get('/Revenue_table_previousmonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const revenueTable = await sequelize.query(
          `
          SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.total),0) AS value
          FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
              FROM inventory_movements) qty_unitprice
          WHERE movement_type_id = 2
          GROUP BY date
          ORDER BY date DESC
          LIMIT 1 OFFSET 1;
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
        text: `${user.name} viewed the Profits Dashboard (Revenue_previous month) `, 
      });
  
      res.send(revenueTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

//1. Profits Dashboard: Revenue
// returns by selected month
router.get('/Revenue_table_today', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const revenueTable = await sequelize.query(
          `
          SELECT coalesce(SUM(qty_unitprice.total),0) AS value
          FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
              FROM inventory_movements) qty_unitprice
          WHERE movement_type_id = 2
              AND CAST(created_at AS DATE) = CAST(CURRENT_TIMESTAMP AS DATE)
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
        text: `${user.name} viewed the Profits Dashboard (Revenue_today) `, 
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
            SELECT revenue.date AS date, coalesce(revenue.rev + cost.cost_of_goods_sold,0) AS value
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

//1. Profits Dashboard: Profits
// returns by selected months
router.get('/Profits_table_currentmonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const profitsTable = await sequelize.query(
          `
          WITH
              revenue
              AS
              (

                  SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.total),0) AS rev
                  FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
                      FROM inventory_movements) qty_unitprice
                  WHERE movement_type_id = 2
                  GROUP BY date
                  ORDER BY date DESC

              ),
              cost
              AS
              (

                  SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitcost.total*-1),0) AS cost
                  FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                      FROM inventory_movements) qty_unitcost
                  WHERE movement_type_id = 2
                  GROUP BY date
                  ORDER BY date DESC
              )
          SELECT revenue.date AS date, revenue.rev - cost.cost AS value
          FROM revenue NATURAL JOIN cost 
          ORDER BY date DESC
          LIMIT 1;
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
        text: `${user.name} viewed the Profits Dashboard (Profits_currentmonth) `, 
      });
  
      res.send(profitsTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

router.get('/Profits_table_previousmonth', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const profitsTable = await sequelize.query(
          `
            WITH
                revenue
            AS
            (

                    SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.total),0) AS rev
            FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
                FROM inventory_movements) qty_unitprice
            WHERE movement_type_id = 2
            GROUP BY date
            ORDER BY date DESC

            ),
                cost
                AS
            (

                    SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitcost.total*-1),0) AS cost
            FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                FROM inventory_movements) qty_unitcost
            WHERE movement_type_id = 2
            GROUP BY date
            ORDER BY date DESC
            )
            SELECT revenue.date AS date, revenue.rev - cost.cost AS value
            FROM revenue NATURAL JOIN cost 
            ORDER BY date DESC
            LIMIT 1
            OFFSET
            1;
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
        text: `${user.name} viewed the Profits Dashboard (Profits _previousmonth) `, 
      });
  
      res.send(profitsTable);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

router.get('/Profits_table_today', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
      const profitsTable = await sequelize.query(
          `
            WITH
                revenue
                AS
                (
                    SELECT coalesce(SUM(qty_unitprice.total), 0) AS revenue
                    FROM (select (quantity * unit_price*-1) AS total, created_at, movement_type_id
                        FROM inventory_movements) qty_unitprice
                    WHERE movement_type_id = 2
                        AND CAST(created_at AS DATE) = CAST(CURRENT_TIMESTAMP AS DATE)

                ),
                cost
                AS
                (
                    SELECT coalesce(SUM(qty_unitcost.total*-1),0 ) AS cost
                    FROM (SELECT (quantity * unit_cost) AS total, created_at, movement_type_id
                        FROM inventory_movements) qty_unitcost
                    WHERE movement_type_id = 2
                        AND CAST(created_at AS DATE) = CAST(CURRENT_TIMESTAMP AS DATE)
                )
            SELECT revenue.revenue AS revenue, cost.cost AS cost, revenue.revenue - cost.cost AS profits
            FROM revenue NATURAL JOIN cost         
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
        text: `${user.name} viewed the Profits Dashboard (Profits_today ) `, 
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
          `      
       

          WITH
          invoiceProfits
          AS
          (
              SELECT
                  SUM(ims.rev) AS revenue,
                  SUM(ims.cogs) AS cost_of_goods_sold,
                  created_at,
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
              GROUP BY sales_order_item_id, created_at
          )
      SELECT
          so.id AS sales_order_id,
          c.id,
          c.company_name,
          c.p1_name,
          to_char(invoiceProfits.created_at, 'DD-MM-YYYY') AS transaction_date,
          SUM(invoiceProfits.revenue) AS total_revenue,
          SUM(invoiceProfits.cost_of_goods_sold*-1) AS total_COGS,
          SUM(invoiceProfits.revenue +  invoiceProfits.cost_of_goods_sold) AS total_profits
      FROM invoiceProfits
          INNER JOIN sales_order_items poitems ON invoiceProfits.sales_order_item_id = poitems.id
          INNER JOIN sales_orders so ON so.id = poitems.sales_order_id
          INNER JOIN customers c ON so.customer_id = c.id
      WHERE c.id = '${customer_id}'
      GROUP BY so.id, c.id, c.company_name, c.p1_name, transaction_date;


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
          t2.id AS product_UUID,
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

// 3. Product Analytics
// returns all the products
router.get('/Product_Analytics_Unique', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {product_id, start_date ,end_date } = req.query;
  try {
      const productAnalytics = await sequelize.query(
          `
            WITH
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
                        AND pdt.id  = '${product_id}'
                  ) sold_inventory_table
                GROUP BY product_id, product_name
            )
        SELECT
            t1.product_name,
            t2.id AS product_UUID,
            t1.quantity_sold * -1 AS quantity_sold,
            t1.average_cogs,
            t1.average_selling_price,
            t1.contribution,
            t1.total_contribution *-1 AS total_contribution,
            (365*(t1.total_price/t1.quantity_sold) / ((t2.start_inv_at_hand + t3.end_inv_at_hand)/2)) AS inventory_turnaround_period
        FROM inventory_sub_table t1
            LEFT JOIN start_inventory_table t2 ON t1.product_id = t2.id
            LEFT JOIN end_inventory_table t3 ON t3.id = t2.id
        ORDER BY total_contribution DESC;
          
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
        text: `${user.name} viewed the Product Analytics Dashboard`, 
      });
  
      res.send(productAnalytics);
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});

// 3. Product Analytics
// returns all the products
router.get('/Product_Monthly_Insights', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {product_id, start_date ,end_date } = req.query;
  try {
      const productAnalytics = await sequelize.query(
          `
          SELECT
          to_char(sold_inventory_table.created_at, 'YYYY-MM') AS date,
          SUM(totalPrice) AS total_price,
          SUM(quantity) AS quantity_sold,
          SUM(sold_inventory_table.totalCOGS)/SUM(quantity) AS average_cogs,
          SUM(sold_inventory_table.totalPrice)/SUM(quantity) AS average_selling_price,
          SUM(sold_inventory_table.totalPrice)/SUM(quantity) - SUM(sold_inventory_table.totalCOGS)/SUM(quantity) AS contribution,
          ((SUM(sold_inventory_table.totalPrice)/SUM(quantity) - SUM(sold_inventory_table.totalCOGS)/SUM(quantity)) * SUM(quantity)) AS total_contribution
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
              AND ims.product_id = '${product_id}'
            ) AS sold_inventory_table
      GROUP BY date
      ORDER BY date ASC;
      
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
                pdt.name AS Product_Name,
                pdt.id AS Product_UUID,
                pdt.description AS Product_Description,
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

//4. Returned goods for supplier
// order by quantity descending
router.get('/Supplier_Returned_Goods_Qn_Desc', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
           SELECT
                pdt.name AS Product_Name,
                pdt.id AS Product_UUID,
                pdt.description AS Product_Description,
                SUM(ims.quantity * -1) AS quantity_returned,
                SUM(ims.quantity * ims.unit_cost * -1) AS supplier_returned_goods_total_value
            FROM inventory_movements ims
                INNER JOIN purchase_order_items poitems ON ims.purchase_order_item_id = poitems.id
                INNER JOIN products pdt ON poitems.product_id = pdt.id
            WHERE movement_type_id = 3
                AND ims.created_at::DATE >= '${start_date}'
                AND ims.created_at::DATE <= '${end_date}'
            GROUP BY pdt.id
            ORDER BY quantity_returned DESC;
      
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

//4. Returned goods for supplier
// returns list of products that have been returned for supplier
router.get('/Supplier_Returned_Goods_Unique', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {product_id, start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
            SELECT
                to_char(ims.created_at, 'YYYY-MM') AS date,
                SUM(ims.quantity * -1) AS quantity_returned,
                SUM(ims.quantity * ims.unit_cost * -1) AS supplier_returned_goods_total_value
            FROM inventory_movements ims
                INNER JOIN purchase_order_items poitems ON ims.purchase_order_item_id = poitems.id
                INNER JOIN products pdt ON poitems.product_id = pdt.id
            WHERE movement_type_id = 3
                AND ims.created_at::DATE >= '${start_date}'
                AND ims.created_at::DATE <= '${end_date}'
                AND ims.product_id = '${product_id}'
            GROUP BY date
            ORDER BY date ASC;
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
router.get('/Customer_Returned_Goods_Qn_Desc', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
          SELECT 
            pdt.name,
            pdt.id AS Product_UUID,
            pdt.description AS Product_Description,
            SUM(ims.quantity) AS quantity_returned,
            SUM(ims.quantity * ims.unit_cost) AS customer_returned_goods_total_value
          FROM inventory_movements ims
            INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
            INNER JOIN products pdt ON soitems.product_id = pdt.id
          WHERE movement_type_id = 3
            AND ims.created_at::DATE >= '${start_date}'
            AND ims.created_at::DATE <= '${end_date}'
          GROUP BY pdt.id
          ORDER BY quantity_returned DESC;
      
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
        text: `${user.name} viewed the Customer Returned Goods Dashboard (Qn desc)`, 
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
            pdt.id AS Product_UUID,
            pdt.description AS Product_Description,
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

//4. Returned goods for customer
// for 1 product 
router.get('/Customer_Returned_Goods_Unique', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {product_id, start_date ,end_date } = req.query;
  try {
      const returned_goods = await sequelize.query(
          `
          SELECT
              to_char(ims.created_at, 'YYYY-MM') AS date,
              SUM(ims.quantity) AS quantity_returned,
              SUM(ims.quantity * ims.unit_cost) AS customer_returned_goods_total_value
          FROM inventory_movements ims
              INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
              INNER JOIN products pdt ON soitems.product_id = pdt.id
          WHERE movement_type_id = 3
              AND ims.created_at::DATE >= '${start_date}'
              AND ims.created_at::DATE <= '${end_date}'
              AND ims.product_id = '${product_id}'
          GROUP BY date
          ORDER BY date ASC;  
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
router.get('/Damaged_Goods_Unique', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {product_id, start_date ,end_date } = req.query;
  try {
      const damaged_goods = await sequelize.query(
          `
          SELECT
          to_char(ims.created_at, 'YYYY-MM') AS date,
          SUM(ims.quantity * -1) AS quantity_damaged,
          SUM(ims.quantity * ims.unit_cost * -1) AS total_damaged_inventory_value
      FROM inventory_movements ims
          INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
          INNER JOIN products pdt ON soitems.product_id = pdt.id
      WHERE movement_type_id = 4
          AND ims.created_at::DATE >= '${start_date}'
          AND ims.created_at::DATE <= '${end_date}'
          AND ims.product_id = '${product_id}'
      GROUP BY date
      ORDER BY date ASC;
      
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
      text: `${user.name} viewed the Damaged Goods Dashboard (qn desc)`, 
    });

    res.send(damaged_goods);

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }
});

//4. Damaged Inventory
// returns list of products that have been damaged  
router.get('/Damaged_Goods_Qn_Desc', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query;
  try {
      const damaged_goods = await sequelize.query(
          `
          SELECT
          pdt.name,
          pdt.id AS Product_UUID,
          pdt.description AS Product_Description,
          SUM(ims.quantity * -1) AS quantity_damaged,
          SUM(ims.quantity * ims.unit_cost * -1) AS total_damaged_inventory_value
          FROM inventory_movements ims
          INNER JOIN sales_order_items soitems ON ims.sales_order_item_id = soitems.id
          INNER JOIN products pdt ON soitems.product_id = pdt.id
          WHERE movement_type_id = 4
          AND ims.created_at::DATE >= '${start_date}'
          AND ims.created_at::DATE <= '${end_date}'
          GROUP BY pdt.id
          ORDER BY quantity_damaged DESC;
      
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
        text: `${user.name} viewed the Damaged Goods Dashboard (qn desc)`, 
      });
  
      res.send(damaged_goods);
  
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
          pdt.id AS Product_UUID,
          pdt.description AS Product_Description,
          SUM(ims.quantity * -1) AS quantity_damaged,
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
          `
          SELECT 
          SUM(pmt.amount) AS total_AR_amount,
          cust.p1_name AS Contact_Person_Name, 
          cust.p1_phone_number AS Contact_Number,
          cust.company_name AS Company_Name,
          cust.company_email AS Email,
          cust.id AS Customer_UUID
          FROM 
          payments pmt INNER JOIN sales_orders so ON pmt.sales_order_id = so.id
          INNER JOIN customers cust ON  so.customer_id = cust.id
          WHERE 
          pmt.accounting_type_id = 2 
          GROUP BY Customer_UUID, Email, Contact_Number, Contact_Person_Name, Company_Name
          ORDER BY total_AR_amount
          LIMIT 10;
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
          `
          SELECT 
          SUM(pmt.amount) AS total_AP_amount,
          supp.s1_name AS Contact_Person_Name, 
          supp.s1_phone_number AS Contact_Number,
          supp.company_name AS Company_Name,
          supp.company_email AS Email,
          supp.id AS Supplier_UUID
          FROM 
          payments pmt INNER JOIN purchase_orders pos ON pmt.purchase_order_id = pos.id
          INNER JOIN suppliers supp ON  pos.supplier_id = supp.id
          WHERE 
          pmt.accounting_type_id = 1 
          GROUP BY Supplier_UUID, Email, Contact_Number, Contact_Person_Name, Company_Name
          ORDER BY total_AP_amount DESC
          LIMIT 10
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
            `
            SELECT 
            pos.id, 
            pos.supplier_invoice_id, 
            SUM(pmt.amount), 
            suppliers.company_name AS Company_Name , 
            suppliers.s1_name AS Contact_Person_Name, 
            suppliers.s1_phone_number AS Contact_Number,
            suppliers.company_email AS Email,
            suppliers.id AS Supplier_UUID
            FROM payments pmt INNER JOIN purchase_orders pos ON pmt.purchase_order_id = pos.id
            INNER JOIN suppliers ON suppliers.id = pos.supplier_id
            WHERE pmt.accounting_type_id = 1
            GROUP BY pos.id, Supplier_UUID, Contact_Person_Name, Company_Name, Contact_Number, Email
            ORDER BY SUM(pmt.amount) DESC
            LIMIT 10
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
          `
          SELECT 
          s.id, 
          SUM(pmt.amount),
          customers.company_name AS Company_Name , 
          customers.p1_name AS Contact_Person_Name, 
          customers.p1_phone_number AS Contact_Number,
          customers.company_email AS Email,
          customers.id AS Customer_UUID
          FROM payments pmt INNER JOIN sales_orders s ON pmt.sales_order_id = s.id
          INNER JOIN customers ON customers.id = s.customer_id
          WHERE pmt.accounting_type_id = 2
          GROUP BY s.id, Customer_UUID , Contact_Person_Name, Company_Name, Contact_Number, Email
          ORDER BY SUM(pmt.amount) DESC
          LIMIT 10;          
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
        text: `${user.name} viewed the Unsettled AR Dashboard (Invoice Level) `, 
      });
      res.send(unsettled_AR)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


//6. AR Table for Test
// returns list of customers 
router.get('/Aging_AR_Table_Test', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
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
              SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) <= 180 THEN amount_due ELSE 0 END) AS b,
              SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) <= 270 THEN amount_due ELSE 0 END) AS c,
              SUM(CASE WHEN DATE_PART('day', '2021-12-31' - created_date) <= 9223372036854775807 THEN amount_due ELSE 0 END) AS d
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
        text: `${user.name} viewed the AR Aging Table (Test) `, 
      });
      res.send(AR_table)
  
      
  
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
      SELECT customer_id, company_name, p1_name, SUM(a) AS over_less_than_30, SUM(b) AS overdue_31_to_60_days, SUM(c) AS  overdue_61_to_90_days, SUM(d) AS overdue_more_than_91_days
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

router.get('/POtable', requireAccess(ViewType.ANALYTICS, false), async function(req, res, next) {
  const { id, purchase_order_status_id, payment_term_id, supplier_id, supplier_name, start_date, end_date } = req.query;
  
  // Build associations to return
  const supplierInc = { model: Supplier };
  const include = [
    { model: PurchaseOrderItem, include: [InventoryMovement, Product] }, 
    { model: Payment, include: [PaymentMethod] },
    ChargedUnder,
    supplierInc,
  ];

  // Build query
  const where = {};
  if (id != null)
    where.id = id;
  if (purchase_order_status_id != null)
    where.purchase_order_status_id = purchase_order_status_id;
  if (payment_term_id != null)
    where.payment_term_id = payment_term_id;
  if (supplier_id != null)
    where.supplier_id = supplier_id;
  if (supplier_name != null)
    supplierInc.where = { company_name: { [Sequelize.Op.iLike]: `%${supplier_name}%` } };
  if (start_date != null && end_date != null)
    where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };

  // Build order
  const order = [
    ['created_at', 'DESC'],
    [Payment, 'created_at', 'ASC'], 
    [PurchaseOrderItem, InventoryMovement, 'created_at', 'ASC']
  ];

  try {
    const purchaseOrders = await PurchaseOrder.findAll({ where: where, include: include, order: order });

    res.send(purchaseOrders);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

router.get('/SOtable', requireAccess(ViewType.ANALYTICS, false), async function(req, res, next) {
  const { id, sales_order_status_id, payment_term_id, customer_id, customer_name, start_date, end_date } = req.query;
  
  // Build associations to return
  const customerInc = { model: Customer };
  const include = [
    { model: SalesOrderItem, include: [InventoryMovement, Product] }, 
    { model: Payment, include: [PaymentMethod] },
    ChargedUnder,
    customerInc,
  ];

  // Build query
  const where = {};
  if (id != null)
    where.id = id;
  if (sales_order_status_id != null)
    where.sales_order_status_id = sales_order_status_id;
  if (payment_term_id != null)
    where.payment_term_id = payment_term_id;
  if (customer_id != null)
    where.customer_id = customer_id;
  if (customer_name != null)
  customerInc.where = { company_name: { [Sequelize.Op.iLike]: `%${customer_name}%` } };
  if (start_date != null && end_date != null)
    where.created_at = { [Sequelize.Op.between]: [start_date, end_date] };

  // Build order
  const order = [
    ['created_at', 'DESC'],
    [Payment, 'created_at', 'ASC'], 
    [SalesOrderItem, InventoryMovement, 'created_at', 'ASC']
  ];

  try {
    const results = await SalesOrder.findAll({ where: where, include: include, order: order });

    res.send(results);

  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

});

//Sales breakdown
router.get('/sales_breakdown', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query; 
  try {
    const sales_table = await sequelize.query(`
    WITH gross_sales_revenue AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.gross_sales_revenue),0) AS gross_revenue
      FROM ( SELECT (quantity * unit_price*-1) AS gross_sales_revenue, created_at, movement_type_id
             FROM inventory_movements) qty_unitprice
             WHERE movement_type_id = 2
             AND created_at::DATE >= '${start_date}'
             AND created_at::DATE <= '${end_date}'
             GROUP BY date
             ORDER BY date ASC ),
    sales_return AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.sales_return),0) AS total_sales_return
      FROM ( SELECT (quantity * unit_price) AS sales_return, created_at, movement_type_id
             FROM inventory_movements
             WHERE unit_price IS NOT NULL ) qty_unitprice
      WHERE movement_type_id = 3
      AND created_at::DATE >= '${start_date}'
      AND created_at::DATE <= '${end_date}'
      GROUP BY date
      ORDER BY date ASC ),
    cash_gross_sales_revenue AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.gross_sales_revenue),0) AS cash_revenue
      FROM ( SELECT (inventory_movements.quantity * inventory_movements.unit_price*-1) AS gross_sales_revenue, inventory_movements.created_at, inventory_movements.movement_type_id
             FROM inventory_movements
             JOIN sales_order_items ON inventory_movements.sales_order_item_id = sales_order_items.id
             JOIN sales_orders ON sales_order_items.sales_order_id = sales_orders.id
             WHERE sales_orders.payment_term_id = 1 ) qty_unitprice
      WHERE movement_type_id = 2
      AND created_at::DATE >= '${start_date}'
      AND created_at::DATE <= '${end_date}'
      GROUP BY date
      ORDER BY date ASC ),
    cash_sales_return AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.gross_sales_revenue),0) AS cash_returns
      FROM ( SELECT (inventory_movements.quantity * inventory_movements.unit_price) AS gross_sales_revenue, inventory_movements.created_at, inventory_movements.movement_type_id
             FROM inventory_movements
             JOIN sales_order_items ON inventory_movements.sales_order_item_id = sales_order_items.id
             JOIN sales_orders ON sales_order_items.sales_order_id = sales_orders.id
             WHERE sales_orders.payment_term_id = 1) qty_unitprice
      WHERE movement_type_id = 3
      AND created_at::DATE >= '${start_date}'
      AND created_at::DATE <= '${end_date}'
      GROUP BY date
      ORDER BY date ASC ),
    credit_gross_sales_revenue AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.gross_sales_revenue),0) AS credit_revenue
      FROM ( SELECT (inventory_movements.quantity * inventory_movements.unit_price*-1) AS gross_sales_revenue, inventory_movements.created_at, inventory_movements.movement_type_id
             FROM inventory_movements
             JOIN sales_order_items ON inventory_movements.sales_order_item_id = sales_order_items.id
             JOIN sales_orders ON sales_order_items.sales_order_id = sales_orders.id
             WHERE sales_orders.payment_term_id = 2) qty_unitprice
      WHERE movement_type_id = 2
      AND created_at::DATE >= '${start_date}'
      AND created_at::DATE <= '${end_date}'
      GROUP BY date
      ORDER BY date ASC ), 
    credit_sales_return AS (
      SELECT to_char(created_at, 'YYYY-MM') AS date, coalesce(SUM(qty_unitprice.gross_sales_revenue),0) AS credit_returns
      FROM ( SELECT (inventory_movements.quantity * inventory_movements.unit_price) AS gross_sales_revenue, inventory_movements.created_at, inventory_movements.movement_type_id
             FROM inventory_movements
             JOIN sales_order_items ON inventory_movements.sales_order_item_id = sales_order_items.id
             JOIN sales_orders ON sales_order_items.sales_order_id = sales_orders.id
             WHERE sales_orders.payment_term_id = 2 ) qty_unitprice
      WHERE movement_type_id = 3
      AND created_at::DATE >= '${start_date}'
      AND created_at::DATE <= '${end_date}'
      GROUP BY date
      ORDER BY date )
    SELECT gross_sales_revenue.date AS period, coalesce(gross_revenue,0) - coalesce(total_sales_return,0) AS Total_revenue, coalesce(cash_revenue,0) - coalesce(cash_returns,0) AS Cash_Revenue, coalesce(credit_revenue,0) - coalesce(credit_returns,0) AS Credit_Revenue
    FROM gross_sales_revenue
    LEFT OUTER JOIN sales_return ON gross_sales_revenue.date = sales_return.date
    LEFT OUTER JOIN cash_gross_sales_revenue ON cash_gross_sales_revenue.date=  gross_sales_revenue.date
    LEFT OUTER JOIN cash_sales_return ON cash_sales_return.date=  gross_sales_revenue.date
    LEFT OUTER JOIN credit_gross_sales_revenue ON credit_gross_sales_revenue.date=  gross_sales_revenue.date
    LEFT OUTER JOIN credit_sales_return ON credit_sales_return.date =  gross_sales_revenue.date`,
    {
      raw: true,
      type: sequelize.QueryTypes.SELECT
    });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ANALYTICS.id,
      text: `${user.name} viewed the Sales Breakdown Chart`, 
    });
    res.send(sales_table)
  
  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }
});

// Minimum Inventory (Limit 10)
router.get('/minimum_inventory_10', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {

  try {
    const inv_table = await sequelize.query(`
      SELECT products.name, SUM(COALESCE(quantity,0)) AS current_inventory_level, MIN(min_inventory_level), (SUM(COALESCE(quantity::decimal,0.00))/MIN(min_inventory_level::decimal) ) AS ratio
      FROM products
      LEFT JOIN inventory_movements ON inventory_movements.product_id = products.id
      GROUP BY products.name
      ORDER BY ratio
      LIMIT 10`,
      {
        raw: true,
        type: sequelize.QueryTypes.SELECT
      });
  
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ANALYTICS.id,
      text: `${user.name} viewed the minimum inventory Chart`, 
    });
    
    res.send(inv_table);
    
  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  };
});

// Minimum Inventory (All)
router.get('/minimum_inventory_all', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  try {
    const inv_table = await sequelize.query(`
      SELECT products.name, SUM(COALESCE(quantity,0)) AS current_inventory_level, MIN(min_inventory_level), (SUM(COALESCE(quantity::decimal,0.00))/MIN(min_inventory_level::decimal) ) AS ratio
      FROM products
      LEFT JOIN inventory_movements ON inventory_movements.product_id = products.id
      GROUP BY products.name
      ORDER BY ratio`,
      {
        raw: true,
        type: sequelize.QueryTypes.SELECT
      });   
  
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ANALYTICS.id,
      text: `${user.name} viewed the minimum inventory Chart`, 
    });
    res.send(inv_table);

  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  };
});

// Cash Flow
router.get('/cash_flow', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query; 
  try {
    const cash_table = await sequelize.query(`
      WITH cash_out AS (
        SELECT to_char(sales_orders.created_at, 'YYYY-MM') AS date,
          SUM(amount) AS cash_outflow
        FROM sales_orders JOIN payments ON payments.sales_order_id = sales_orders.id
        WHERE payments.payment_method_id IS NOT NULL
        AND sales_orders.created_at::DATE >= '${start_date}'
        AND sales_orders.created_at::DATE <= '${end_date}'
        GROUP BY date
        ORDER BY date ),
      cash_in AS (
        SELECT to_char(purchase_orders.created_at, 'YYYY-MM') AS date,
          SUM(amount) AS cash_inflow
        FROM purchase_orders JOIN payments ON payments.purchase_order_id = purchase_orders.id
        WHERE payments.payment_method_id IS NOT NULL
        AND purchase_orders.created_at::DATE >= '${start_date}'
        AND purchase_orders.created_at::DATE <= '${end_date}'
        GROUP BY date
        ORDER BY date )
      SELECT cash_out.date AS period, coalesce(cash_inflow,0) AS cash_inflow, coalesce(cash_outflow,0) AS cash_outflow, coalesce(cash_inflow,0) + coalesce(cash_outflow,0) AS net_cash_flow
      FROM cash_in FULL OUTER JOIN cash_out ON cash_in.date = cash_out.date`,
      {
        raw: true,
        type: sequelize.QueryTypes.SELECT
      });
  
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ANALYTICS.id,
        text: `${user.name} viewed the cash flow chart`, 
      });
      res.send(cash_table);
    
  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  };
});

// AP/AR Summary Table
router.get('/summary_table', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
  const {start_date ,end_date } = req.query; 
  try {
    const summary_table = await sequelize.query(`
      WITH AR_Settlement AS (
        SELECT date_trunc('month', sales_orders.created_at) AS month, SUM(amount) AS AR_Settled
        FROM sales_orders JOIN payments ON payments.sales_order_id = sales_orders.id
        WHERE payments.payment_method_id IS NOT NULL 
        AND sales_orders.payment_term_id = 2
        AND sales_orders.created_at::DATE >= '${start_date}'
        AND sales_orders.created_at::DATE <= '${end_date}'
        GROUP BY month
        ORDER BY month ),
      AP_Settlement AS (
        SELECT date_trunc('month', purchase_orders.created_at) AS month, SUM(amount*-1) AS AP_Settled
        FROM purchase_orders JOIN payments ON payments.purchase_order_id = purchase_orders.id
        WHERE payments.payment_method_id IS NOT NULL 
        AND purchase_orders.payment_term_id = 2
        AND purchase_orders.created_at::DATE >= '${start_date}'
        AND purchase_orders.created_at::DATE <= '${end_date}'
        GROUP BY month
        ORDER BY month ),  
      AR AS (
        SELECT date_trunc('month', sales_orders.created_at) AS month, SUM(amount*-1) AS AR_amount
        FROM sales_orders JOIN payments ON payments.sales_order_id = sales_orders.id
        WHERE payments.payment_method_id IS NULL 
        AND sales_orders.payment_term_id = 2
        AND sales_orders.created_at::DATE >= '${start_date}'
        AND sales_orders.created_at::DATE <= '${end_date}'
        GROUP BY month
        ORDER BY month ), 
      AP AS (
        SELECT date_trunc('month', purchase_orders.created_at) AS month, SUM(amount) AS AP_amount
        FROM purchase_orders JOIN payments ON payments.purchase_order_id = purchase_orders.id
        WHERE payments.payment_method_id IS NULL 
        AND purchase_orders.payment_term_id = 2
        AND purchase_orders.created_at::DATE >= '${start_date}'
        AND purchase_orders.created_at::DATE <= '${end_date}'
        GROUP BY month
        ORDER BY month )
      SELECT final_ar_table.all_months, COALESCE(Balance_AR,0) AS Balance_AR, COALESCE(AR_Settled,0) AS AR_Settled, COALESCE(Balance_AP,0) AS Balance_AP, COALESCE(AP_Settled,0) AS AP_Settled
      FROM (SELECT all_months, SUM(AR_amount) over (ORDER BY all_months ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Balance_AR
            FROM AR RIGHT OUTER JOIN (SELECT month AS all_months FROM
              (SELECT month FROM AP UNION 
               SELECT month FROM AR UNION 
               SELECT month FROM AR_Settlement UNION 
               SELECT month FROM AP_Settlement) AS all_months_table) AS all_months_table
            ON all_months_table.all_months = AR.month) AS final_ar_table INNER JOIN (
               SELECT all_months, SUM(AP_amount) over (ORDER BY all_months ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS Balance_AP
               FROM AP RIGHT OUTER JOIN (SELECT month AS all_months FROM 
                (SELECT month FROM AP UNION 
                 SELECT month FROM AR UNION 
                 SELECT month FROM AR_Settlement UNION 
                 SELECT month FROM AP_Settlement) AS all_months_table) AS all_months_table
               ON all_months_table.all_months = AP.month) AS final_ap_table
               ON final_ar_table.all_months = final_ap_table.all_months
      LEFT OUTER JOIN AR_Settlement ON final_ar_table.all_months = AR_Settlement.month
      LEFT OUTER JOIN AP_Settlement ON final_ar_table.all_months = AP_Settlement.month`,
    {
      raw: true,
      type: sequelize.QueryTypes.SELECT
    });

    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ANALYTICS.id,
      text: `${user.name} viewed the AP/AR summary table`, 
    });
    res.send(summary_table);
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  };

});

module.exports = router; 