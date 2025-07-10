const admin = require('firebase-admin');

//TODO change firebase config
const serviceAccountCredentials = require('../firebase-adminsdk.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountCredentials),
    });
}

module.exports = { admin };
