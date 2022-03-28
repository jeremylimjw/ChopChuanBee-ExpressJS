module.exports.insertDemoData = async () => {
    const { Customer, CustomerMenu, ChargedUnder } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const { Supplier, SupplierMenu } = require('../models/Supplier');
    const { Employee } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const { LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
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

        for (let customer of customers) {
            if (i === 0 || Math.random() < 0.1) {
                customerMenus.push({ customer_id: customer.id, product_id: products[i].id, product_alias: products[i].name.split(' ')[1] });
            }
        }
        
        for (let supplier of suppliers) {
            if (i === 0 || Math.random() < 0.1) {
                supplierMenus.push({ supplier_id: supplier.id, product_id: products[i].id });
            }
        }
    }

    await CustomerMenu.bulkCreate(customerMenus);
    await SupplierMenu.bulkCreate(supplierMenus);

    await Employee.bulkCreate(employeesData.map(x => ({...x, leave_accounts: STANDARD_LEAVE_ACCOUNTS })), { include: [AccessRight, LeaveAccount] })
    await ChargedUnder.bulkCreate(chargedUndersData);

    const { initAnalytics } = require('./analytics');
    await initAnalytics();

    console.log('Demo data initiated')
}