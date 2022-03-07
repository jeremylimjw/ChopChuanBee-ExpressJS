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
            `SELECT to_char(created_at, 'YYYY-MM') AS date, SUM(qty_unitcost.total) AS cost_of_goods_sold
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
        console.log(cogsTable[0])
        console.log('print')

        // Record to admin logs
        const user = res.locals.user;
        await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ANALYTICS.id,
          text: `${user.name} accessed the Profits Dashboard (COGS) `, 
        });
    
        res.send(cogsTable);
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});

//1. Payments Dashboard: Unsettled AP
router.get('/Unsettled_AP', requireAccess(ViewType.ANALYTICS, true), async function(req, res, next) {
   
    try {
        const unsettled_AP = await sequelize.query(
            `SELECT pos.id, pos.supplier_invoice_id, SUM(pmt.amount) 
            FROM payments pmt INNER JOIN purchase_orders pos ON pmt.purchase_order_id = pos.id
            WHERE pmt.accounting_type_id = 1 
            GROUP BY pos.id`,
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
          text: `${user.name} accessed the Payments Dashboard (Unsettled AP table) `, 
        });
    
        res.send(unsettled_AP.toJSON());
    
      } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
      }
});


module.exports = router; 
