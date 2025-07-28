const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const cron = require('node-cron');
const express = require('express');
const AppError = require('./utils/AppError.js');

const { jobFunction } = require('./utils/Crons.js');
const { makeDirectories } = require('./utils/Helper.js');

require('dotenv').config();

process.on('unhandledException', (error) => {
    console.log(error.name, error.message);
    console.log('UNHANDLED EXCEPTION! - Shutting down...');
    process.exit(1);
});

const ErrorController = require('./controller/ErrorController.js');
const AuthRoutes = require('./routes/AuthRoutes.js');
const DoctorRoutes = require('./routes/DoctorRoutes.js');
const PostRoutes = require('./routes/PostRoutes.js');
const BlockRoutes = require('./routes/BlockPatientRoutes.js');
const WebhookRoutes = require('./routes/WebhookRoutes');
const AddressRoutes = require('./routes/AddressRoutes');
const BlockPatientRoutes = require('./routes/BlockPatientRoutes');
const NotificationRoutes = require('./routes/NotificationRoutes.js');

makeDirectories();

const app = express();
const server = http.createServer(app);

// app.use('/webhook', WebhookRoutes);

const corsOptions = {
    credentials: true,
    origin: '*',
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '500mb' }));
// app.use('/uploads', express.static(`uploads`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.get('/', (req, res) => {
    res.send('Hello from my Express app!');
});

morgan.token('colored-status', (_, res) => {
    const status = res.statusCode;
    if (status >= 500) return `\x1b[31m${status}\x1b[0m`; // Red for 5xx
    if (status >= 400) return `\x1b[33m${status}\x1b[0m`; // Yellow for 4xx
    if (status >= 300) return `\x1b[36m${status}\x1b[0m`; // Cyan for 3xx
    if (status >= 200) return `\x1b[32m${status}\x1b[0m`; // Green for 2xx
    return `${status}`;
});

morgan.token('colored-url', (req) => `\x1b[34m${req.url}\x1b[0m`);
morgan.token('colored-method', (req) => {
    const method = req.method;
    switch (method) {
        case 'GET':
            return `\x1b[32m${method}\x1b[0m`;
        case 'POST':
            return `\x1b[33m${method}\x1b[0m`;
        case 'PUT':
            return `\x1b[36m${method}\x1b[0m`;
        case 'DELETE':
            return `\x1b[31m${method}\x1b[0m`;
        default:
            return method;
    }
});
morgan.token('body', (req) => JSON.stringify(req.body));

app.use(
    morgan(
        ':colored-method :colored-url :colored-status :response-time ms - :res[content-length] - payload :body\n------------------------------------',
    ),
);

app.use('/api/v1/patient/auth', AuthRoutes);
app.use('/api/v1/doctor/auth', DoctorRoutes);
app.use('/api/v1/patient/post', PostRoutes);
app.use('/api/v1/patient/block', BlockRoutes);
app.use('/api/v1/patient/address', AddressRoutes);
app.use('/api/v1/patient/block', BlockPatientRoutes);
// app.use('/api/v1/product', ProductRoutes);
// app.use('/notifications', NotificationRoutes);

const SocketIOService = require('./socket.js');

// Instantiate the SocketIOService with the server
const socketService = new SocketIOService(server);
socketService.initialize();

app.all('*', (req, res, next) => {
    next(AppError.notFound(`Can't find ${req.originalUrl} on the Server`));
});

cron.schedule('*/10 * * * *', async () => {
    console.log('Cron job started every 10 minutes');
    jobFunction();
});

app.use(ErrorController);

module.exports = { server, socketService };
