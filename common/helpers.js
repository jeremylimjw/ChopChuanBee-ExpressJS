const { query } = require('express');
const { Sequelize } = require('sequelize');
const { AccessRight } = require('../models/AccessRight');
const { Customer } = require('../models/Customer');
const { Employee } = require('../models/Employee');
const { LeaveAccount } = require('../models/LeaveAccount');
const { LeaveApplication } = require('../models/LeaveApplication');
const Log = require('../models/Log');
const { Product } = require('../models/Product');
const { Supplier } = require('../models/Supplier');
const View = require('../models/View');

function getModel(name) {
    switch (name) {
        case 'access_right': return AccessRight;
        case 'customer': return Customer;
        case 'employee': return Employee;
        case 'leave_account': return LeaveAccount;
        case 'leave_application': return LeaveApplication;
        case 'log': return Log;
        case 'product': return Product;
        case 'supplier': return Supplier;
        case 'view': return View;
        default: return null;
    }
}


const parseRequest = (queries) => {
    const predicate = {
        where: {},
    }

    predicate.include = []
    let entities = queries.include ? Array.isArray(queries.include) ? queries.include : [queries.include] : [];
    for (let entity of entities) {
        // Get all query keys for this entity
        const newQueryKeys = Object.keys(queries).filter(x => x.startsWith(`${entity}_`)).map(x => {
            return x.replace(`${entity}_`, '');
        })

        // Store all query values for this entity
        const newQuery = newQueryKeys.reduce((prev, current) => {
            prev[`${current}`] = queries[`${entity}_${current}`]
            delete queries[`${entity}_${current}`];
            return prev;
        }, {})
        
        // Recursively parse into sequelize query
        if (Object.keys(newQuery).length > 0) {
            const newPredicate = parseRequest(newQuery);
            predicate.include.push({ model: getModel(entity), ...newPredicate }) 
        } else {
            predicate.include.push({ model: getModel(entity) }) 
        }
    }
    delete queries.include;

    // Parse Limit field if any
    if (queries.limit != null) {
        predicate.limit = queries.limit;
        delete queries.limit;
    }

    // Parse offset field if any
    if (queries.offset != null) {
        predicate.offset = queries.offset;
        delete queries.offset;
    }

    // Parse order by fields
    if (queries.order_by != null) {
        const order = [queries.order_by];
        if (order[0].endsWith('_desc')) {
            order[0] = order[0].replace('_desc', '');
            order.push('DESC');
        } else {
            order.push('ASC');
        }
        predicate.order = [order];
        delete queries.order_by;
    }

    // Transform between query Sequelize.Op.between query
    for (let key of Object.keys(queries)) {
        if (key.endsWith('_from')) {
            const from = queries[key];
            const newKey = key.replace('_from', '');

            const toKey = newKey+'_to';
            const to = queries[toKey];

            predicate.where[`${newKey}`] = { [Sequelize.Op.between]: [from, to] }

            delete queries[key];
            delete queries[toKey];
            break;
        }
    }

    // Transform fields into Sequelize.Op.iLike query
    for (let key of Object.keys(queries)) {
        if (key.endsWith('_like')) {
            const newKey = key.replace('_like', '');
            predicate.where[`${newKey}`] = { [Sequelize.Op.iLike]: "%"+queries[key]+"%" }
            delete queries[key];
        }
    }

    // Append remaining fields
    Object.assign(predicate.where, queries);

    return predicate;
}

module.exports = {
    parseRequest,
    assertNotNull(obj, keys) {
        for (let key of keys) {
            if (obj[`${key}`] == null) {
                throw `'${key}' is required.`;
            }
        }
    }
}