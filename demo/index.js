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

    const customersData = require('./customers');
    const productsData = require('./products');
    const suppliersData = require('./suppliers');
    const employeesData = require('./employees');
    const chargedUndersData = require('./chargedUnders');

    const products = await Product.bulkCreate(productsData);
    const customers = await Customer.bulkCreate(customersData);
    const suppliers = await Supplier.bulkCreate(suppliersData);

    let customerMenus = [];
    let supplierMenus = [];

    for (let i = 0; i < products.length; i++) {
        // Create Stocks
       await InventoryMovement.create({ product_id: products[i].id, unit_cost: Math.random()*50, quantity: Math.ceil(Math.random()*3)*100, movement_type_id: MovementType.PURCHASE.id })

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

    await ChargedUnder.bulkCreate(chargedUndersData);

    const { initAnalytics } = require('./analytics');
    await initAnalytics();

    console.log('Demo data initiated')
}