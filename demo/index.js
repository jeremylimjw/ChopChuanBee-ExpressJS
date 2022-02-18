module.exports.insertDemoData = async () => {
    const { Customer } = require('../models/Customer');
    const customers = require('./customers');

    await Customer.bulkCreate(customers);
}