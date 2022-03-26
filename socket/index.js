const socketio = require('socket.io');

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
        const userId = socket.handshake.query.id;

        socket.join(userId);
        
        lastSeens[userId] = "Online";

        subscribersOf[userId]?.forEach(id => socket.broadcast.to(id).emit("online", { _id: userId, lastSeen: "Online" }));
        subscribers[userId] = new Set();

        
        socket.on('new_channel', data => {
            console.log('new_channel', data)
            // if (data.participants) {
            //     Object.keys(data.participants).forEach(id => {
            //         if (id !== userId) {
            //             socket.broadcast.to(id).emit("new_channel", data);
            //         }
            //     })
            // }
        });
        
        
        socket.on('message', data => {
            console.log('message', data)
            // data.participants?.forEach(id => {
            //     socket.broadcast.to(id).emit("message", data);
            // })
        });


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


        socket.on('update_last_received', data => {
            // data.participants.forEach(id => {
            //     socket.broadcast.to(id).emit("update_last_received", { userId: userId, channelId: data.channelId, now: data.now });
            // })
        })


        socket.on('update_last_read', data => {
            // data.participants.forEach(id => {
            //     socket.broadcast.to(id).emit("update_last_read", { userId: userId, channelId: data.channelId, now: data.now });
            // })
        })


        socket.on('disconnect', () => { 
            console.log('disconnect')
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

