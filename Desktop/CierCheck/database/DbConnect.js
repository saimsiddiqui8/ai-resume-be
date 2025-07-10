require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function database() {
    let instance = null;

    const connect = async () => {
        try {
            if (instance) {
                return instance;
            }

            instance = await mongoose.connect(process.env.MONGO_DB_SERVICE, {
                dbName: process.env.MONGO_DB_DEV,
            });
            console.log('Database connected successfully');
            loadModels();
            return instance;
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    };

    const loadModels = () => {
        try {
            const modelsDir = path.join(__dirname, '../models');
            fs.readdirSync(modelsDir).forEach((file) => {
                if (file.endsWith('.js')) {
                    require(path.join(modelsDir, file));
                }
            });
            console.log('Models loaded successfully');
        } catch (error) {
            console.error('Error loading models:', error);
        }
    };

    const disconnect = async () => {
        try {
            await mongoose.disconnect();
            console.log('Database disconnected');
        } catch (error) {
            console.error('Error during disconnection:', error);
        }
    };

    return {
        connect,
        disconnect,
    };
}

module.exports = database = database();
