const { DataTypes } = require('sequelize');
const AccountingTypeEnum = require('../common/AccountingTypeEnum');
const MovementType = require('../common/MovementTypeEnum');
const PaymentTermType = require('../common/PaymentTermType');
const { sequelize } = require('../db');
const { Product } = require('./Product');
const axios = require('axios');
const PaymentMethodType = require('../common/PaymentMethodType');
const { InventoryMovement } = require('./InventoryMovement');

const SalesOrder = sequelize.define('sales_order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    gst_rate: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    offset: {
        type: DataTypes.DECIMAL,
        defaultValue: 0,
    },
    has_gst: DataTypes.INTEGER,
    show_gst: DataTypes.BOOLEAN,
    remarks: DataTypes.STRING,
    has_delivery: DataTypes.BOOLEAN,
    delivery_address: DataTypes.STRING,
    delivery_postal_code: DataTypes.STRING,
    delivery_remarks: DataTypes.STRING,
    closed_on: DataTypes.DATE,
}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});

const SalesOrderItem = sequelize.define('sales_order_item', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    unit_price: {
        type: DataTypes.DECIMAL,
    },
}, {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});



// 'Save for later' use case
async function updateSalesOrder(newSalesOrder) {
    await SalesOrder.update(newSalesOrder, { where: { id: newSalesOrder.id } })

    if (newSalesOrder.sales_order_items != null) {
        await SalesOrderItem.destroy({ where: { sales_order_id: newSalesOrder.id }});
        await SalesOrderItem.bulkCreate(newSalesOrder.sales_order_items);
    }
}


function buildNewPayment(salesOrderId, amount, paymentTermId, paymentMethodId) {
    const payment = {
        sales_order_id: salesOrderId, 
        movement_type_id: MovementType.SALE.id,
        amount: amount,
    }

    if (paymentTermId === PaymentTermType.CASH.id) {
        payment.payment_method_id = paymentMethodId;
    } else if (paymentTermId === PaymentTermType.CREDIT.id) {
        payment.accounting_type_id = AccountingTypeEnum.RECEIVABLE.id;
    }

    return payment;
}


function buildRefundPayment(salesOrderId, amount, paymentTermId, paymentMethodId = PaymentMethodType.CASH.id) {
    const payment = {
        sales_order_id: salesOrderId, 
        movement_type_id: MovementType.REFUND.id,
        amount: -amount,
    }

    if (paymentTermId === PaymentTermType.CASH.id) {
        payment.payment_method_id = paymentMethodId;
    } else if (paymentTermId === PaymentTermType.CREDIT.id) {
        payment.accounting_type_id = AccountingTypeEnum.RECEIVABLE.id;
    }

    return payment;
}


// Validate sales order items and reduce duplicates
async function validateOrderItems(orderItems) {
    // Reduce duplicated products
    const temp = [];
    for (let item of orderItems) {
        // Validation
        if (!item.unit_price) throw 'Each order item must have a unit price.';
        if (item.quantity <= 0) throw 'Each order item must have a valid quantity.';

        const foundIndex = temp.findIndex(x => x.product_id === item.product_id);
        if (foundIndex >= 0) {
            temp[foundIndex].sum += item.quantity*item.unit_price;
            temp[foundIndex].count += item.quantity;
        } else {
            temp.push({...item, sum: item.quantity*item.unit_price, count: item.quantity });
        }
    }

    const reduced = temp.map(x => ({...x, quantity: x.count, unit_price: x.sum/x.count }));

    for (let item of reduced) {
      const results = await sequelize.query(
        `
          SELECT COALESCE(im.total_quantity, 0) total_quantity
          FROM products p
            LEFT OUTER JOIN 
              (
                SELECT product_id, SUM(quantity) total_quantity FROM inventory_movements im
                  GROUP BY product_id
              ) im ON p.id = im.product_id
              WHERE p.id = $1
            ORDER BY p.created_at DESC
        `,
        { 
          bind: [item.product_id],
          type: sequelize.QueryTypes.SELECT 
        }
      );

      if (results.length && results[0].total_quantity && results[0].total_quantity < item.quantity) {
        const product = await Product.findByPk(item.product_id);
        throw `${product.name} does not have enough stock (left ${results[0].total_quantity}) for order quantity ${item.quantity}`;
      }
    }

    return reduced;
}


async function validateAndBuildNewInventories(salesOrder, orderItems) {
    for (let item of orderItems) {

      const stocks = await sequelize.query(
        `
        WITH o AS (SELECT COALESCE(-1*SUM(quantity),0) AS outflow FROM inventory_movements im WHERE quantity < 0 AND product_id = $1)
        SELECT *, CASE WHEN (sum_over-(SELECT outflow FROM o)) > quantity THEN quantity ELSE (sum_over-(SELECT outflow FROM o)) END remaining
          FROM  
            (
              SELECT 
                created_at, product_Id, unit_cost, unit_price, quantity, movement_type_id, SUM(quantity) OVER(ORDER BY created_at) AS sum_over 
              FROM inventory_movements im WHERE product_id = $1 AND quantity > 0
            ) i  
            WHERE i.sum_over-(SELECT outflow FROM o) >= 0 AND (sum_over-(SELECT outflow FROM o)) > 0;
        `,
        { 
          bind: [item.product_id],
          type: sequelize.QueryTypes.SELECT 
        }
      );
  
      let target = item.quantity;
      let sum = 0;
      let count = 0;
      
      for (let stock of stocks) {
        let toAdd = target - count;
        if (toAdd < stock.remaining) { // If got leftover
          sum += toAdd * stock.unit_cost;
          count += toAdd;
        } else {
          sum += stock.quantity * stock.unit_cost;
          count += stock.quantity;
        }
        if (count >= target) break;
      }
  
      item.unit_cost = sum/count;
    }

    const movements = orderItems.map(x => ({
        sales_order_item_id: x.id,
        product_id: x.product_id,
        quantity: -x.quantity, // negative since its taking out from our inventory
        unit_cost: x.unit_cost,
        unit_price: x.unit_price*(1+salesOrder.gst_rate/100),
        movement_type_id: MovementType.SALE.id,
    }))
      
    return movements;
}


// { id: uuid (sales_order_item_id), top_up: number }
// Calculates unit_cost for the movements
async function buildRefundInventories(orderItems) {
    // Calculate inventory movements to add
    const inventoryMovements = [];
    for (let item of orderItems) {
        const salesOrderItem = await SalesOrderItem.findByPk(item.id);
        const movements = await InventoryMovement.findAll({ where: { sales_order_item_id: item.id }})
        let unitCost = 0;
        for (let i = movements.length - 1; i >= 0; i--) { // iterate backwards
          if (movements[i].quantity < 0) {
            unitCost = movements[i].unit_cost; // if first inventory movement from the bottom of the array has negative quantity, it is the latest
            break;
          }
        }
  
        const newMovement = {
          product_id: salesOrderItem.product_id,
          sales_order_item_id: salesOrderItem.id,
          quantity: item.top_up, // should be positive sign because it is inventory incoming
          unit_cost: unitCost,
          movement_type_id: MovementType.REFUND.id,
        }

        inventoryMovements.push(newMovement);
    }
    
    return inventoryMovements;
}


async function buildDeliveryOrder(salesOrder) {
    // Retrieve geocoordinates of the delivery destination
    const { data: geocode } = await axios.get(`https://developers.onemap.sg/commonapi/search`, {
      params: {
        searchVal: salesOrder.delivery_postal_code,     // Keywords entered by user that is used to filter out the results.
        returnGeom: 'Y',            // Checks if user wants to return the geometry.
        getAddrDetails: 'Y',        // Checks if user wants to return address details for a point.
        pageNum: 1,                 // Specifies the page to retrieve your search results from.
      }
    })
    
    if (geocode.results.length === 0) {
      throw `Could not find any location with the postal code ${salesOrder.delivery_postal_code}`;
    }

    const deliveryOrder = {
        sales_order_id: salesOrder.id,
        address: salesOrder.delivery_address,
        postal_code: salesOrder.delivery_postal_code,
        remarks: salesOrder.delivery_remarks,
        longitude: geocode.results[0].LONGITUDE,
        latitude: geocode.results[0].LATITUDE,
    }
  
    return deliveryOrder;
  }
  

module.exports = { 
    SalesOrder, 
    SalesOrderItem, 
    updateSalesOrder, 
    validateAndBuildNewInventories, 
    validateOrderItems,
    buildNewPayment,
    buildRefundPayment,
    buildRefundInventories,
    buildDeliveryOrder,
};