require('dotenv').config();
const { server } = require('./app');
const db = require('./database/DbConnect.js');

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', async () => {
    await db.connect();
    console.log(`Server is running on port http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    await db.disconnect();
    process.exit(0);
});
