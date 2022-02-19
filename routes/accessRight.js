var express = require('express');
const { requireAccess } = require('../auth');
const { compare, assertNotNull } = require('../common/helpers');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { insertAccessRights, validateAccessRights, removeAccessRights, validateRemoveAccessRights, AccessRight, createAccessRight, deleteAccessRight } = require('../models/AccessRight');
const { Employee } = require('../models/Employee');
const Log = require('../models/Log');



router.put('/accessRight', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
    const { id, access_rights } = req.body;

    try {
        assertNotNull(req.body, ['id', 'access_rights']);
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const employee = await Employee.findByPk(id, { include: AccessRight });
        
        const [toRemove, toAdd] = compare(employee.access_rights, access_rights, 'view_id');

        // Remove old access rights
        for (let item of toRemove) {
            const predicate = { 
                employee_id: employee.id, 
                view_id: item.view_id 
            }
            await deleteAccessRight(predicate, res.locals.user, employee);
        }

        // Insert new access rights
        for (let item of access_rights) {
            const newItem = {
                employee_id: employee.id,
                view_id: item.view_id,
                has_write_access: item.has_write_access,
            }
            await createAccessRight(newItem, res.locals.user, employee);
        }

        res.send({ id: id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;