const { Server } = require('socket.io');

class SocketIOService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
    }

    async authorizeUser(socket, next) {
        const auth = socket.handshake.headers.authorization;
        console.log(auth, 'Authorization Header');

        // Check if the auth header is present, and verify it (this should be based on your logic)
        if (auth) {
            const user = { id: '123', name: 'John Doe' }; // Placeholder user data

            socket.user = user;
            console.log('User authenticated:', user);

            next(); // Proceed with the connection
        } else {
            console.log('Unauthorized connection attempt');
            socket.disconnect(); // Disconnect the socket
        }
    }

    initialize() {
        // Use the authorization middleware
        this.io.use((socket, next) => {
            this.authorizeUser(socket, next);
        });

        // Set up the connection event
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('sendMessage', (message) => {
                console.log('Message received:', message);
                // Broadcast the message to all connected clients
                this.io.emit('message', message);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }
}

module.exports = SocketIOService;
