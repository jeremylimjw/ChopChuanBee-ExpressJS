const moment = require('moment');
const LeaveTypeEnum = require('../common/LeaveTypeEnum');
const MovementType = require('../common/MovementTypeEnum');

module.exports.insertDemoData = async () => {
    const { LeaveApplication } = require('../models/LeaveApplication');
    const { Customer, CustomerMenu, ChargedUnder } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const { Supplier, SupplierMenu } = require('../models/Supplier');
    const { Employee } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const { LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
    const { InventoryMovement } = require('../models/InventoryMovement');
    const { PurchaseOrder, PurchaseOrderItem } = require('../models/PurchaseOrder');

    const customersData = require('./customers');
    const productsData = require('./products');
    const suppliersData = require('./suppliers');
    const employeesData = require('./employees');
    const chargedUndersData = require('./chargedUnders');

    const products = await Product.bulkCreate(productsData);
    const customers = await Customer.bulkCreate(customersData);
    const suppliers = await Supplier.bulkCreate(suppliersData);
    const chargedUnders = await ChargedUnder.bulkCreate(chargedUndersData);

    const po = await PurchaseOrder.create({ 
        payment_term_id: 2, 
        purchase_order_status_id: 2, 
        supplier_id: suppliers[0].id, 
        gst_rate: 0, 
        offset: 0, 
        charged_under_id: chargedUnders[0].id,
        created_at: new Date(0), // prevent analytics from querying this
    })

    let customerMenus = [];
    let supplierMenus = [];

    for (let i = 0; i < products.length; i++) {
        // Create Stocks
        const unitCost = Math.random()*50;
        const quantity = Math.ceil(Math.random()*3)*100;
        await PurchaseOrderItem.create({
            unit_cost: unitCost,
            quantity: quantity,
            purchase_order_id: po.id,
            product_id: products[i].id,
            inventory_movements: [
                { 
                    product_id: products[i].id, 
                    unit_cost: unitCost, 
                    quantity: quantity, 
                    movement_type_id: MovementType.PURCHASE.id,
                    created_at: new Date(0), // prevent analytics from querying this
                }
            ],
            created_at: new Date(0), // prevent analytics from querying this
        }, { include: InventoryMovement })

        // Create Customer Menu Items
        for (let customer of customers) {
            if (i === 0 || Math.random() < 0.1) {
                customerMenus.push({ customer_id: customer.id, product_id: products[i].id, product_alias: products[i].name.split(' ')[1] });
            }
        }
        
        // Create Supplier Menu Items
        for (let supplier of suppliers) {
            if (i === 0 || Math.random() < 0.1) {
                supplierMenus.push({ supplier_id: supplier.id, product_id: products[i].id });
            }
        }
    }

    await CustomerMenu.bulkCreate(customerMenus);
    await SupplierMenu.bulkCreate(supplierMenus);

    await Employee.bulkCreate(employeesData.map(x => ({...x, leave_accounts: STANDARD_LEAVE_ACCOUNTS })), { include: [AccessRight, LeaveAccount] })

    // Create leave applications
    const leaveAccounts = await LeaveAccount.findAll({ where: { leave_type_id: LeaveTypeEnum.ANNUAL.id } });
    for (let leaveAccount of leaveAccounts) {
        const start = moment().add(Math.ceil(Math.random()*7), 'd');
        for (let i = 0; i < 2; i++) {
            const numDays = Math.ceil(Math.random()*7);
            const end = moment(start).add(numDays, 'd');
            await LeaveApplication.create({ leave_account_id: leaveAccount.id, start_date: start.toDate(), end_date: end.toDate(), num_days: numDays, paid: false, leave_status_id: Math.ceil(Math.random()*4) })
        }
    }

    const { initAnalytics } = require('./analytics');
    await initAnalytics();

    console.log('Demo data initiated')
}