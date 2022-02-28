module.exports.insertDemoData = async () => {
    const { Customer, ChargedUnder } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const { Supplier } = require('../models/Supplier');
    const { Employee } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const { LeaveAccount, STANDARD_LEAVE_ACCOUNTS } = require('../models/LeaveAccount');
    const customers = require('./customers');
    const products = require('./products');
    const suppliers = require('./suppliers');
    const employees = require('./employees');
    const chargedUnders = require('./chargedUnders');

    await Customer.bulkCreate(customers);
    await Product.bulkCreate(products);
    await Supplier.bulkCreate(suppliers);
    await Employee.bulkCreate(employees.map(x => ({...x, leave_accounts: STANDARD_LEAVE_ACCOUNTS })), { include: [AccessRight, LeaveAccount] })
    await ChargedUnder.bulkCreate(chargedUnders);

    console.log('Demo data initiated')
}