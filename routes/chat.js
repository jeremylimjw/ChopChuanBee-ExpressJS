var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const { ChargedUnder } = require('../models/Customer');
const ViewType = require('../common/ViewType');
const { parseRequest, assertNotNull } = require('../common/helpers');
const { Sequelize } = require('sequelize');
const Log = require('../models/Log');
const { Channel, Participant, Text } = require('../models/Chat');

const { getSocket } = require('../socket');
const { Employee } = require('../models/Employee');


router.get('/channel', async function(req, res, next) {
    const { employee_id } = req.query;
    
    try {
        const results = await Channel.findAll({ 
            include: [
                { model: Participant, include: [Employee], where: { employee_id: employee_id } },
                { model: Text, include: [Employee] },
                Employee
            ] 
        })

        res.send(results);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.post('/channel', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const channel = req.body;
    
    try {
        assertNotNull(channel, ['owner_id', 'participants'])

    } catch(err) {
        res.status(400).send(err);
        return;
    }

    try {
        const user = res.locals.user;
        const io = getSocket();

        const newChannel = await Channel.create(channel, { include: [Participant] });

        const getChannel = await Channel.findByPk(newChannel.id, { include: [
            { model: Participant, include: [Employee] },
            { model: Text, include: [Employee] },
            Employee] })

        for (let participant of newChannel.participants) {
            if (participant.employee_id !== user.id) {
                io.to(participant.employee_id).emit('new_channel', { newChannel: getChannel.toJSON() })
            }
        }

        res.send(getChannel.toJSON());

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


router.put('/', requireAccess(ViewType.ADMIN, true), async function(req, res, next) {
//   const { id, name } = req.body;

//   try {
//     assertNotNull(req.body, ['id', 'name'])
//   } catch(err) {
//     res.status(400).send(err);
//     return;
//   }

//   try {
//     const result = await ChargedUnder.update(req.body, { where: { id: id } });

//     // If 'id' is not found return 400 Bad Request, if found then return the 'id'
//     if (result[0] === 0) {
//       res.status(400).send(`Charged Under id ${id} not found.`)

//     } else {
//       // Record to admin logs
//       const user = res.locals.user;
//       await Log.create({ 
//         employee_id: user.id, 
//         view_id: ViewType.ADMIN.id,
//         text: `${user.name} updated Charged Under ${name}'s record`, 
//       });

//       res.send({ id: id });
//     }


//   } catch(err) {
//     // Catch and return any uncaught exceptions while inserting into database
//     console.log(err);
//     res.status(500).send(err);
//   }

});

module.exports = router;
