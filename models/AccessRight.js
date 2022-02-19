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



function validateAccessRights(access_rights) {
    if (access_rights == null) {
        throw ("'access_rights' is required.")
    }
    
    if (!Array.isArray(access_rights)) {
        throw ("'access_rights' must be an array.")
    }

    for (let access_right of access_rights) {
        if (access_right.view_id == null || access_right.has_write_access == null) {
            throw (`'access_rights' array must be in { view_id: number, has_write_access: boolean } format.`);
        }
    }
}

function validateRemoveAccessRights(access_rights) {
    // Check if an array
    if (!Array.isArray(access_rights)) {
        throw ("'access_rights' must be an array")
    }

    // Check array structure
    for (let access_right of access_rights) {
        if (access_right.view_id == null) {
            throw (`'access_rights' array must be in { view_id: number } format.`);
        }
    }
}

async function insertAccessRights(access_rights, employee, user, avoidLogging) {
    // Upsert the access right
    for (let access_right of access_rights) {
        await AccessRight.upsert({ 
            has_write_access: access_right.has_write_access, 
            employee_id: employee.id, 
            view_id: access_right.view_id 
        })
        
        // Get view name with `view_id`
        const viewName = Object.keys(ViewType).filter(key => ViewType[key].id == access_right.view_id);

        if (!avoidLogging) {
            // Record in admin logs
            await Log.create({ 
                employee_id: user.id, 
                view_id: ViewType.ADMIN.id,
                text: `${user.name} granted ${viewName} access to ${employee.name}${access_right.has_write_access ? ' with write access' : ''}`, 
            });
        }
    }
}

async function removeAccessRights(access_rights, employee, user, avoidLogging) {
    for (let access_right of access_rights) {
        const accessRight  = await AccessRight.findOne({ where: { view_id: access_right.view_id } })

        if (accessRight != null) {
            // Delete the access right
            await AccessRight.destroy({ where: { view_id: access_right.view_id } });

            // Find the view name using `view_id`
            const viewName = Object.keys(ViewType).filter(key => ViewType[key].id == access_right.view_id);

            if (!avoidLogging) {
                // Record in admin logs
                await Log.create({ 
                    employee_id: user.id, 
                    view_id: ViewType.ADMIN.id,
                    text: `${user.name} revoked ${viewName} access from ${employee.name}`, 
                });
            }
        }
    }
}

async function createAccessRight(access_right, from, to) {
    // Delete the access right
    await AccessRight.create(access_right);

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

module.exports = { AccessRight, validateAccessRights, validateRemoveAccessRights, insertAccessRights, removeAccessRights, createAccessRight, deleteAccessRight };