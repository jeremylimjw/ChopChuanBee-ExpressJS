const socketio = require('socket.io');
const { Participant } = require('../models/Chat');

let io;

async function init(server) {

    const lastSeens = {};
    const subscribersOf = {}; // List of users subscribed to a user
    const subscribers = {}; // The socket user's list of users to listen to

    io = socketio(server, {
        cors: {
            origin: process.env.REACT_URL,
        }
    });

    io.on('connection', socket => {
        console.log(socket.handshake.query.name, 'connected')
        const userId = socket.handshake.query.id;

        socket.join(userId);
        
        lastSeens[userId] = "Online";

        subscribersOf[userId]?.forEach(id => socket.broadcast.to(id).emit("online", { _id: userId, lastSeen: "Online" }));
        subscribers[userId] = new Set();


        socket.on('get_last_seens', data => {
            console.log('get_last_seens', data)
            // subscribers[userId]?.forEach(id => {
            //     subscribersOf[id].delete(userId);
            // })
            // subscribers[userId] = new Set();

            // const res = data.participants.map(id => {
            //     subscribersOf[id] ? subscribersOf[id].add(userId) : subscribersOf[id] = new Set([userId]);
            //     subscribers[userId].add(id);

            //     return { _id: id, lastSeen: lastSeens[id] || null }
            // })
            // io.to(userId).emit('get_last_seens', res);
        })


        socket.on('update_last_read', async data => {
            console.log('update_last_read', data)
            const { employee_id, channel_id, timestamp } = data;
            const participants = await Participant.findAll({ where: { channel_id: channel_id }})

            for (let participant of participants) {
                socket.broadcast.to(participant.employee_id).emit("last_read", { 
                    channel_id: channel_id,
                    employee_id: employee_id,
                    timestamp: timestamp,
                });
            }
        })


        socket.on('update_last_received', async data => {
            console.log('update_last_received', data)
            const { employee_id, channel_id, timestamp } = data;
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
            // lastSeens[userId] = new Date();
            
            // subscribers[userId]?.forEach(id => {
            //     subscribersOf[id].delete(userId);
            // })
            // delete subscribers[userId];

            // subscribersOf[userId]?.forEach(id => socket.broadcast.to(id).emit("offline", { _id: userId, lastSeen: lastSeens[userId] }));

        });
    });


    return io;
}

function getSocket() {
    return io;
}

module.exports = { init, getSocket };

