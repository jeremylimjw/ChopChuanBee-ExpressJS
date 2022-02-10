var express = require('express');
var router = express.Router();
const { requireAccess } = require('../auth');
const { Payment, PaymentMethod, AccountingType } = require('../models/Payment');
const ViewType = require('../common/ViewType');
const Log = require('../models/Log');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../db');

//sofp statement of financial position 
router.get('/SOFP', requireAccess(ViewType.ACCOUNTING, true), async function(req, res, next) {
    const { date } = req.query;
    
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
    const newStart_date = new Date(start_date).toISOString();
    const revenue = await sequelize.query(
        `SELECT sum(amount) 
        FROM payments
        WHERE movement_type_id = 1
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
        WHERE movement_type_id = 1
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
      console.log("ISO : "+newStart_date);
      console.log("normal start date : "+start_date);
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
module.exports = router; 



