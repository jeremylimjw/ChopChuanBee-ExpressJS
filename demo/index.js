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
    for (let customer of customers) {
        const newItems = products.filter(() => Math.random() < 0.1).map(product => ({ customer_id: customer.id, product_id: product.id, product_alias: product.name.split(' ')[1] }))
        customerMenus = customerMenus.concat(newItems)
    }
    await CustomerMenu.bulkCreate(customerMenus);

    let supplierMenus = [];
    for (let supplier of suppliers) {
        const newItems = products.filter(() => Math.random() < 0.1).map(product => ({ supplier_id: supplier.id, product_id: product.id }))
        supplierMenus = supplierMenus.concat(newItems)
    }
    await SupplierMenu.bulkCreate(supplierMenus);

    await Employee.bulkCreate(employeesData.map(x => ({...x, leave_accounts: STANDARD_LEAVE_ACCOUNTS })), { include: [AccessRight, LeaveAccount] })
    await ChargedUnder.bulkCreate(chargedUndersData);

    console.log('Demo data initiated')
}