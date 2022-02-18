module.exports.insertDemoData = async () => {
    const { Customer } = require('../models/Customer');
    const { Product } = require('../models/Product');
    const customers = require('./customers');
    const products = require('./products');

    await Customer.bulkCreate(customers);
    await Product.bulkCreate(products);

    console.log('Demo data initiated')
}