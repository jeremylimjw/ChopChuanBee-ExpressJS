const { DataTypes } = require('sequelize');
const ViewType = require('../common/ViewType');
const { sequelize } = require('../db');
const Log = require('./Log');

const AccessRight = sequelize.define('access_right', {
    has_write_access: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
}, {
    updatedAt: 'updated_at', // Standardize 'updatedAt' column name to 'updated_at'
    createdAt: 'created_at', // Standardize 'createdAt' column name to 'created_at'
});


async function createAccessRight(access_right, from, to) {
    // Delete the access right
    await AccessRight.upsert(access_right);

    // Find the view name using `view_id`
    const viewKey = Object.keys(ViewType).filter(key => ViewType[key].id == access_right.view_id);

    // Record in logs
    await Log.create({ 
        employee_id: from.id, 
        view_id: ViewType.ADMIN.id,
        text: `${from.name} granted ${ViewType[viewKey].name} access from ${to.name}`, 
    });
}

async function deleteAccessRight(predicate, from, to) {
    // Delete the access right
    await AccessRight.destroy({ where: predicate});

    // Find the view name using `view_id`
    const viewKey = Object.keys(ViewType).filter(key => ViewType[key].id == predicate.view_id);

    // Record in logs
    await Log.create({ 
        employee_id: from.id, 
        view_id: ViewType.ADMIN.id,
        text: `${from.name} revoked ${ViewType[viewKey].name} access from ${to.name}`, 
    });
}

module.exports = { AccessRight, createAccessRight, deleteAccessRight };