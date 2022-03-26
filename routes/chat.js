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


router.get('/channel', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { employee_id } = req.query;
    
    try {
        assertNotNull(req.query, ['employee_id'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        // Get all channel IDs associated to the user
        const results = await Channel.findAll({ 
            include: [
                { model: Participant, include: [Employee], where: { employee_id: employee_id } },
                { model: Text, include: [Employee] },
                Employee
            ] 
        })
        
        const user = res.locals.user;

        // Add unread_count and last_text
        const channels = [];
        for (let result of results) {
            const channel = await Channel.findByPk(result.id, { 
                include: [
                    { model: Participant, include: [Employee] },
                    { model: Text, include: [Employee] },
                    Employee
                ] 
            })

            const sender = channel.participants.filter(x => x.employee_id === user.id)[0];
            const unread_count = channel.texts.reduce((prev, current) => {
                if (current.created_at > sender?.last_read || sender?.last_read == null) {
                    prev++;
                }
            }, 0)

            channels.push({
                ...channel.toJSON(),
                last_text: channel.texts.length > 0 ? channel.texts[channel.texts.length-1] : null,
                unread_count: unread_count,
            });

        }

        // Sort by last text date or channel created date, in DESC order
        channels.sort((a, b) => {
            const comparatorA = a.last_text?.created_at || a.created_at;
            const comparatorB = b.last_text?.created_at || b.created_at;
            return comparatorB - comparatorA;
        })

        res.send(channels);
        
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
