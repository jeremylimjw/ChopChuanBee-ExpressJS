module.exports.insertDemoData = async () => {
    const { Customer } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const { Supplier } = require('../models/Supplier');
    const { Employee } = require('../models/Employee');
    const { AccessRight } = require('../models/AccessRight');
    const customers = require('./customers');
    const products = require('./products');
    const suppliers = require('./suppliers');
    const employees = require('./employees');

    await Customer.bulkCreate(customers);
    await Product.bulkCreate(products);
    await Supplier.bulkCreate(suppliers);
    await Employee.bulkCreate(employees, { include: [AccessRight] })

    console.log('Demo data initiated')
}