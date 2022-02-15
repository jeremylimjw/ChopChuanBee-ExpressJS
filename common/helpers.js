const { Sequelize } = require('sequelize');

module.exports = {
    parseRequest: (queries, useiLike) => {
        const predicate = {
            where: {},
        }
    
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
    },
    assertNotNull(obj, keys) {
        for (let key of keys) {
            if (obj[`${key}`] == null) {
                throw `'${key}' is required.`;
            }
        }
    }
}