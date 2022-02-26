var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { ChargedUnder } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');


router.get('/', requireAccess(ViewType.GENERAL), async function(req, res, next) {
  const predicate = parseRequest(req.query);
  
  try {
    const chargedUnders = await ChargedUnder.findAll(predicate);
    res.send(chargedUnders);
    
  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
  const { name } = req.body;
  
  try {
    assertNotNull(req.body, ['name'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const newRecord = await ChargedUnder.create(req.body);
    
    // Record to admin logs
    const user = res.locals.user;
    await Log.create({ 
      employee_id: user.id, 
      view_id: ViewType.ADMIN.id,
      text: `${user.name} created a charged under record ${name}`, 
    });

    res.send(newRecord.toJSON());

  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.put('/', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
  const { id, name } = req.body;

  try {
    assertNotNull(req.body, ['id', 'name'])
  } catch(err) {
    res.status(400).send(err);
    return;
  }

  try {
    const result = await ChargedUnder.update(req.body, { where: { id: id } });

    // If 'id' is not found return 400 Bad Request, if found then return the 'id'
    if (result[0] === 0) {
      res.status(400).send(`Charged Under id ${id} not found.`)

    } else {
      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.ADMIN.id,
        text: `${user.name} updated Charged Under ${name}'s record`, 
      });

      res.send({ id: id });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});


router.post('/deactivate', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
      res.status(400).send("'id' is required.", )
      return;
  }

  try {
    const record = await ChargedUnder.findByPk(id);

    if (record == null) {
      res.status(400).send(`Charged Under id ${id} not found.`)

    } else {
      record.deactivated_date = new Date();
      record.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
          employee_id: user.id, 
          view_id: ViewType.ADMIN.id,
          text: `${user.name} deactivated Charged Under ${record.name} record`, 
      });

      res.send({ id: record.id, deactivated_date: record.deactivated_date });
    }

  } catch(err) {
      // Catch and return any uncaught exceptions while inserting into database
      console.log(err);
      res.status(500).send(err);
  }

});


router.post('/activate', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
  const { id } = req.body;

  if (id == null) {
    res.status(400).send("'id' is required.", )
    return;
  }

  try {
    const record = await ChargedUnder.findByPk(id);

    if (record == null) {
      res.status(400).send(`Charged Under id ${id} not found.`)

    } else {
      record.deactivated_date = null;
      record.save();

      // Record to admin logs
      const user = res.locals.user;
      await Log.create({ 
        employee_id: user.id, 
        view_id: ViewType.CRM.id,
        text: `${user.name} activated Charged Under ${record.name} record`, 
      });

      res.send({ id: record.id, deactivated_date: null });
    }


  } catch(err) {
    // Catch and return any uncaught exceptions while inserting into database
    console.log(err);
    res.status(500).send(err);
  }

});

// POST and PUT admin only

module.exports = router;
