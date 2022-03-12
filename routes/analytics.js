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



//2. Payments Dashboard: Unsettled AP
router.get('/Unsettled_AP', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
    try {
        const unsettled_AP = await sequelize.query(
            `SELECT pos.id, SUM(pmt.amount) 
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
          text: `${user.name} viewed the Unsettled AP Dashboard `, 
        });
        res.send(unsettled_AP)
    
        
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//2. Payments Dashboard: Unsettled AR
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
        text: `${user.name} viewed the Unsettled AR Dashboard `, 
      });
      res.send(unsettled_AR)
  
      
  
    } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
    }
});


module.exports = router; 
