var express = require('express');
const { requireAccess } = require('../auth');
var router = express.Router();
const ViewType = require('../common/ViewType');
const { assertNotNull } = require('../common/helpers');
const { Channel, Participant, Text } = require('../models/Chat');
const { Sequelize } = require('sequelize');

const { getSocket, getLastSeens, subscribeTo } = require('../socket');
const { Employee } = require('../models/Employee');


// Get all channels for a user
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
        const participants = await Participant.findAll({ where: { employee_id: employee_id }});
        
        const user = res.locals.user;

        // Add unread_count and last_text
        const channels = [];
        for (let participant of participants) { // Iterate through the associated channels

            // Update the user's last received
            const now = new Date();
            participant.last_received = now;
            await participant.save();

            // Get the full channel document
            const channel = await Channel.findByPk(participant.channel_id, { 
                include: [
                    { model: Participant, include: [Employee] },
                    Employee
                ] 
            })

            // Pull texts to aggregate unread count and last text
            const texts = await Text.findAll({ 
                where: { channel_id: participant.channel_id }, 
                include: [Employee],
                order: [['created_at', 'DESC']]
            })

            const sender = channel.participants.filter(x => x.employee_id === user.id)[0];
            const unread_count = texts.reduce((prev, current) => {
                if (current.created_at > sender?.last_read) {
                    return prev+1;
                }
                return prev;
            }, 0)

            channels.push({
                ...channel.toJSON(),
                last_text: texts.length > 0 ? texts[0] : null,
                unread_count: unread_count,
            });

            // Broadcast to participants the user's updated last received
            const io = getSocket();
            for (let participant of channel.participants) {
                if (participant.employee_id !== user.id) { // Except sender
                    io.to(participant.employee_id).emit('last_received', { 
                        employee_id: user.id,
                        channel_id: channel.id,
                        timestamp: now,
                    })
                }
            }

        }

        // Sort by last text date or channel created date, in DESC order
        channels.sort((a, b) => {
            const comparatorA = a.last_text?.created_at || a.created_at;
            const comparatorB = b.last_text?.created_at || b.created_at;
            return comparatorB - comparatorA;
        })

        // Subscribe to their last seens
        for (let channel of channels) {
            subscribeTo(user.id, channel.participants);
        }

        // return last seens here also, new route or append?

        res.send(channels);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


// Get a single channel
router.get('/channel/id', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { channel_id, textLimit } = req.query;
    
    try {
        assertNotNull(req.query, ['channel_id'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const user = res.locals.user;

        // Update the user's last received and last read
        const now = new Date();
        await Participant.update({ last_read: now, last_received: now }, { where: { employee_id: user.id, channel_id: channel_id }})

        // Get the full channel document
        const channel = await Channel.findByPk(channel_id, { 
            include: [
                { model: Participant, include: [Employee] },
                { model: Text, include: [Employee], order: [['created_at', 'DESC']], limit: +textLimit || 20 },
                Employee
            ] 
        })

        // Broadcast to participants the user's last read
        const io = getSocket();
        for (let participant of channel.participants) {
            if (participant.employee_id !== user.id) { // Except sender
                io.to(participant.employee_id).emit('last_read', { 
                    employee_id: user.id,
                    channel_id: channel.id,
                    timestamp: now,
                })
            }
            
            // Subscribe to their last seens and get last seens
            subscribeTo(participant.employee_id, channel.participants);
        }

        res.send(channel.toJSON());
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


// Create new channel
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

        const getChannel = await Channel.findByPk(newChannel.id, { 
            include: [
                { model: Participant, include: [Employee] },
                { model: Text, include: [Employee] },
                Employee
            ] 
        })

        // Broadcast to participants the new channel
        for (let participant of newChannel.participants) {
            if (participant.employee_id !== user.id) { // Except sender
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


// Delete channel
router.delete('/channel', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { channel_id } = req.query
    
    try {
        assertNotNull(req.query, ['channel_id'])

    } catch(err) {
        res.status(400).send(err);
        return;
    }

    try {
        const user = res.locals.user;
        const io = getSocket();

        const channel = await Channel.findByPk(channel_id, { 
            include: [
                { model: Participant, include: [Employee] },
                Employee
            ] 
        })

        // Broadcast to participants the channel
        for (let participant of channel.participants) {
            if (participant.employee_id !== user.id) { // Except sender
                io.to(participant.employee_id).emit('remove_channel', { channel_id: channel.id })
            }
        }

        await Channel.destroy({ where: { id: channel_id } });

        res.send({ id: channel_id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


// Delete participant
router.delete('/channel/participant', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { channel_id, employee_id } = req.query
    
    try {
        assertNotNull(req.query, ['channel_id', 'employee_id'])

    } catch(err) {
        res.status(400).send(err);
        return;
    }

    try {
        const user = res.locals.user;
        const io = getSocket();

        const channel = await Channel.findByPk(channel_id, { 
            include: [
                { model: Participant, include: [Employee] },
                Employee
            ] 
        })

        // Broadcast to participants the channel
        for (let participant of channel.participants) {
            if (participant.employee_id !== user.id) { // Except sender
                io.to(participant.employee_id).emit('remove_channel_participant', { 
                    channel_id: channel.id, 
                    employee_id: employee_id 
                })
            }
        }

        await Participant.destroy({ where: { channel_id: channel_id, employee_id: employee_id } });

        res.send({ channel_id: channel_id, employee_id: employee_id });

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});



// Get texts
router.get('/text', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { channel_id, offset, limit } = req.query;
    
    try {
        assertNotNull(req.query, ['channel_id'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const user = res.locals.user;

        const texts = await Text.findAll({ 
            where: { channel_id: channel_id }, 
            include: [Employee],
            order: [['created_at', 'DESC']],
            limit: +limit || 20,
            offset: +offset || 0,
        })

        res.send(texts);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});


// Create new text
router.post('/text', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const text = req.body;
    
    try {
        assertNotNull(text, ['channel_id', 'employee_id', 'text'])

    } catch(err) {
        res.status(400).send(err);
        return;
    }

    try {
        const user = res.locals.user;
        const io = getSocket();

        const createdText = await Text.create(text);
        const newText = await Text.findByPk(createdText.id, { include: [Employee] });

        const channel = await Channel.findByPk(newText.channel_id, { include: [Participant] });

        // Broadcast to participants of the channel
        for (let participant of channel.participants) {
            if (participant.employee_id !== user.id) {
                io.to(participant.employee_id).emit('message', { newText: newText })
            }
        }

        // Update user's last received and last seen
        const now = new Date();
        await Participant.update({ last_read: now, last_received: now }, { where: { employee_id: text.employee_id, channel_id: text.channel_id }});

        res.send(newText);

    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});



// Get last seens
router.get('/lastSeen', requireAccess(ViewType.GENERAL), async function(req, res, next) {
    const { channel_ids } = req.query;
    
    try {
        assertNotNull(req.query, ['channel_ids'])
    } catch(err) {
        res.status(400).send(err);
        return;
    }
    
    try {
        const user = res.locals.user;

        const participants = await Participant.findAll({ where: { channel_id: { [Sequelize.Op.in]: channel_ids } } });
        const lastSeens = getLastSeens();
        
        const results = {};
        for (let participant of participants) {
            if (user.id !== participant.employee_id) {
                results[participant.employee_id] = lastSeens[participant.employee_id];
            }
        }

        res.send(results);
        
    } catch(err) {
        // Catch and return any uncaught exceptions while inserting into database
        console.log(err);
        res.status(500).send(err);
    }

});

module.exports = router;
