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
    
        // Transform fields into Sequelize.Op.iLike query
        if (useiLike != null) {
            for (let key of useiLike) {
                if (queries[`${key}`] != null) {
                    predicate.where[`${key}`] = { [Sequelize.Op.iLike]: "%"+queries[`${key}`]+"%" }
                    delete queries[`${key}`];
                }
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