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
const EmailMiddleware = require('./middlewares/EmailMiddleware.js');
const DeviceMiddleware = require('./middlewares/DeviceMiddleware.js');

const AuthRoutes = require('./routes/AuthRoutes');
const WebhookRoutes = require('./routes/WebhookRoutes');
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
app.use('/uploads', express.static(`uploads`));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

app.get('/', (req, res) => {
    res.send('Hello from my Express app!');
});

app.use(morgan('dev'));

app.use(EmailMiddleware);
app.use(DeviceMiddleware);

app.use('/patient/auth', AuthRoutes);
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
