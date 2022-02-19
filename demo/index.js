module.exports.insertDemoData = async () => {
    const { Customer } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const { Supplier } = require('../models/Supplier');
    const customers = require('./customers');
    const products = require('./products');
    const suppliers = require('./suppliers');

    await Customer.bulkCreate(customers);
    await Product.bulkCreate(products);
    await Supplier.bulkCreate(suppliers);

    console.log('Demo data initiated')
}