const socketio = require('socket.io');
const { Participant } = require('../models/Chat');

let io;

const lastSeens = {};

// List of users subscribed to a user - { [string]: Set() }
const subscribersOf = {};
// The socket user's list of users to listen to - { [string]: Set() }
const subscribers = {};

async function init(server) {

    io = socketio(server, {
        cors: {
            origin: process.env.REACT_URL,
        }
    });

    io.on('connection', socket => {
        const userId = socket.handshake.query.id;

        // ALICE : c8a38325-a7f1-4b0d-ac23-a1dee5515d30
        // ADMIN: 930da5b9-9796-4e4e-afab-b7cf90863604
        console.log(socket.handshake.query.name, 'connected', userId)

        socket.join(userId);
        
        lastSeens[userId] = "Online";

        // Broadcast to all subscribers
        subscribersOf[userId]?.forEach(id => socket.broadcast.to(id).emit("update_last_seen", { employee_id: userId, timestamp: "Online" }));

        // Update a user's last read timestamp in a channel
        socket.on('update_last_read', async data => {
            const { employee_id, channel_id, timestamp } = data;

            await Participant.update({ last_read: timestamp }, { where: { employee_id: employee_id, channel_id: channel_id }})
            const participants = await Participant.findAll({ where: { channel_id: channel_id }})

            // Broadcast to all participants of the channel
            for (let participant of participants) {
                socket.broadcast.to(participant.employee_id).emit("last_read", { 
                    channel_id: channel_id,
                    employee_id: employee_id,
                    timestamp: timestamp,
                });
            }
        })


        socket.on('update_last_received', async data => {
            const { employee_id, channel_id, timestamp } = data;

            await Participant.update({ last_received: timestamp }, { where: { employee_id: employee_id, channel_id: channel_id }})
            const participants = await Participant.findAll({ where: { channel_id: channel_id }})

            for (let participant of participants) {
                socket.broadcast.to(participant.employee_id).emit("last_received", { 
                    channel_id: channel_id,
                    employee_id: employee_id,
                    timestamp: timestamp,
                });
            }
        })


        socket.on('disconnect', () => { 
            console.log(socket.handshake.query.name, 'disconnect')
            // Update last seen timestamp
            lastSeens[userId] = new Date();

            subscribersOf[userId]?.forEach(id => socket.broadcast.to(id).emit("update_last_seen", { employee_id: userId, timestamp: lastSeens[userId] }));
            
            // Cleanup all subscribed users to the disconnecting user
            clearSubscribers(userId);

        });
    });


    return io;
}

function getSocket() {
    return io;
}

function getLastSeens() {
    return lastSeens;
}

function clearSubscribers(userId) {
    subscribers[userId]?.forEach(id => {
        subscribersOf[id].delete(userId);

        if (subscribersOf[id]?.size === 0) {
            delete subscribersOf[id];
        }
    })
    delete subscribers[userId];
}

function subscribeTo(userId, participants) {
    for (let participant of participants) {
        if (participant.employee_id === userId) continue; // Exclude self

        // Register as a subscriber
        if (subscribersOf[participant.employee_id]) {
            subscribersOf[participant.employee_id].add(userId)
        } else {
            subscribersOf[participant.employee_id] = new Set([userId])
        }

        // Keep track of the subscribed users
        if (subscribers[userId]) {
            subscribers[userId].add(participant.employee_id)
        } else {
            subscribers[userId] = new Set([participant.employee_id])
        }
    }
}

module.exports = { init, getSocket, getLastSeens, clearSubscribers, subscribeTo };

