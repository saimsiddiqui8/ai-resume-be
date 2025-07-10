const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const multer = require('multer');
const geolib = require('geolib');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const { v4: uuidv4 } = require('uuid');
const { admin } = require('./../config/FirebaseConfig.js');

dotenv.config();

const makeDirectories = async () => {
    const parent = './uploads';
    const dirnames = ['pictures', 'videos'];
    try {
        fs.mkdir(parent, { recursive: true }, (err) => {
            if (err) throw err;
            for (const dirname of dirnames) {
                const dirPath = path.join(parent, dirname);
                fs.mkdir(dirPath, { recursive: true }, (err) => {
                    if (err) throw err;
                });
            }
            console.log('All directories checked or created successfully.');
        });
    } catch (err) {
        console.error(err);
    }
};

const generateToken = (data, expiresIn) => {
    return jwt.sign(data, process.env.JWT_SECRET, {
        expiresIn: expiresIn ?? process.env.JWT_EXPIRES_IN,
    });
};

const calculateDistance = (coords1, coords2) => {
    const distanceInMeters = geolib.getDistance(
        { latitude: coords1[1], longitude: coords1[0] },
        { latitude: coords2[1], longitude: coords2[0] },
    );

    // Convert meters to miles
    const distanceInMiles = distanceInMeters / 1609.34;
    return distanceInMiles.toFixed(2);
};

const generateNumericOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (subject, message, recipient) => {
    const senderName = process.env.APP_NAME;
    const senderEmail = process.env.SENDGRID_SENDER || process.env.EMAIL_USER;

    if (!senderEmail) {
        console.error('Error: Sender email is not configured.');
        return false;
    }

    const emailData = {
        to: recipient,
        from: { name: senderName, email: senderEmail },
        subject,
        html: message,
    };

    try {
        if (process.env.SENDGRID_ENABLED) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            await sgMail.send(emailData);
            console.log('Message sent successfully via SendGrid.');
        } else if (
            process.env.EMAIL_SERVICE &&
            process.env.EMAIL_USER &&
            process.env.EMAIL_PASSWORD
        ) {
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                ...emailData,
                from: { name: senderName, address: senderEmail },
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Message sent successfully via Nodemailer. Message ID: ${info.messageId}`);
        } else {
            console.error('Error: No email configuration found.');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        return false;
    }
};

const sendSignInEmail = async (name, email, Otp) => {
    let signUptemp = await fs.readFileSync(
        path.join(process.cwd(), 'view', 'signIn.handlebars'),
        'utf8',
    );
    signUptemp = await signUptemp.replace('[Name]', name).replace('[verificationCode]', Otp);
    const isSent = await sendEmail(
        `Account Verification ${process.env.APP_NAME}`,
        signUptemp,
        email,
    );
};

const sendOTPEmail = async (name, email, Otp) => {
    let otpTemp = await fs.readFileSync(
        path.join(process.cwd(), 'view', 'resendOtp.handlebars'),
        'utf8',
    );

    otpTemp = await otpTemp
        .replace('[Name]', name)
        .replace('[otpCode]', Otp)
        .replace('[appName]', process.env.APP_NAME);
    const isSent = await sendEmail('Account Verification', otpTemp, email);
};

const forgetPasswordEmail = async (name, email, Otp) => {
    let otpTemp = await fs.readFileSync(
        path.join(process.cwd(), 'view', 'forgetPassword.handlebars'),
        'utf8',
    );

    otpTemp = await otpTemp
        .replace('[Name]', name)
        .replace('[otpCode]', Otp)
        .replace('[appName]', process.env.APP_NAME);
    const isSent = await sendEmail('Password OTP Verification ', otpTemp, email);
};

const sendOTPToPhone = async (toNumber, otpCode) => {
    try {
        if (!process.env?.TWILIO_ENABLED) {
            console.error('Error: Twilio is not enabled.');
            return false;
        }

        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const response = await client.messages.create({
            body: `Your Rentibles verification code is ${otpCode}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: toNumber,
        });
        console.log(`SMS sent successfully with SID: ${response.sid}`);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error.message || error);
        return false;
    }
};

const createMulter = (destination, video = true) => {
    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                const fileExtension = file.originalname.split('.').pop();
                console.log('FileExtension =>', fileExtension);
                video && fileExtension === 'mp4'
                    ? cb(null, './uploads/videos/')
                    : cb(null, destination);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname); // Keep the original filename
            },
        }),
    });
};

const getTime = () => {
    return Math.floor(new Date().getTime() / 1000);
};

const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const dollarToCents = (dollar) => {
    return dollar * 100;
};

const centsToDollars = (cents) => {
    return cents / 100;
};

const calculateStripeFees = (amountInDollars) => {
    return 0.3 + amountInDollars * 0.029;
};

const calculateApplicationFees = (amountInDollars) => {
    return (amountInDollars * process.env.STRIPE_TEST_APPLICATION_FEE) / 100;
};

const generateOrderCode = (prefixLength = 3, digitLength = 6) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const prefix = Array.from(
        { length: prefixLength },
        () => letters[Math.floor(Math.random() * letters.length)],
    ).join('');

    // Generate the digits part using map
    const digitsPart = Array.from(
        { length: digitLength },
        () => digits[Math.floor(Math.random() * digits.length)],
    ).join('');

    return `${prefix}-${digitsPart}`;
};

const paginate = async (model, query, page = 1, limit = 10) => {
    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const skip = (currentPage - 1) * itemsPerPage;

    const totalCount = await model.countDocuments(query);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
        skip,
        pagination: {
            itemsPerPage,
            currentPage,
            totalItems: totalCount,
            totalPages,
        },
    };
};

const aggregatePaginate = async (model, query, page = 1, limit = 10) => {
    const currentPage = parseInt(page, 10);
    const itemsPerPage = parseInt(limit, 10);
    const skip = (currentPage - 1) * itemsPerPage;

    const [result = {}] = await model.aggregate([...query, { $count: 'totalCount' }]);

    const { totalCount = 0 } = result;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    return {
        skip,
        pagination: {
            itemsPerPage,
            currentPage,
            totalItems: totalCount,
            totalPages,
        },
    };
};

//FIREBASE
const verifyUID = async (uid) => {
    try {
        const user = await admin.auth().getUser(uid);
        console.log('Successfully fetched user data');
        return user;
    } catch (error) {
        console.log('Error fetching user data:', error);
        throw error;
    }
};

const createChatRoom = async ({ senderUID, receiverUID, chatId }) => {
    try {
        const db = admin.firestore();

        const chatRef = db.collection('chats').doc(chatId);

        const chatSnapshot = await chatRef.get();
        if (!chatSnapshot.exists) {
            await chatRef.set({
                users: [senderUID, receiverUID],
                chatId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Chat room created with ID: ${chatId}`);
        } else {
            console.log(`Chat room with ID ${chatId} already exists.`);
        }
    } catch (error) {
        console.error('Error creating chat room:', error.message);
    }
};

const deleteChatRoom = async (chatId) => {
    try {
        const db = admin.firestore();
        const chatRef = db.collection('chats').doc(chatId);

        await db.recursiveDelete(chatRef);

        console.log(`Chat room with ID ${chatId} and its subcollections have been deleted.`);
    } catch (error) {
        console.error('Error deleting chat room:', error.message);
    }
};

const deleteUserFromFirebase = async (uid) => {
    try {
        const db = admin.firestore();

        const userRef = db.collection('users').doc(uid);
        await userRef.delete();
        console.log(`User document with ID ${uid} deleted from Firestore.`);

        await admin.auth().deleteUser(uid);
        console.log(`Firebase user with UID ${uid} deleted successfully.`);
    } catch (error) {
        console.error('Error deleting user:', error.message);
    }
};

const addUserDetailsOnFirebase = async ({ _id, uid, name, email, profilePicture, role }) => {
    try {
        const db = admin.firestore();

        const userRef = db.collection('users').doc(uid);

        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            await userRef.set({
                _id: _id.toString(),
                uid,
                name,
                email,
                profilePicture: profilePicture || null,
                role,
            });
            console.log(`User created with UID: ${uid}`);
        } else {
            console.log(`User with UID ${uid} already exists.`);
        }
    } catch (error) {
        console.error('Error adding user details:', error.message);
    }
};

const updateUserDetailsOnFirebase = async ({ uid, name, profilePicture }) => {
    try {
        const db = admin.firestore();

        const userRef = db.collection('users').doc(uid);

        const userSnapshot = await userRef.get();
        if (userSnapshot.exists) {
            await userRef.update({
                ...(name && { name }),
                ...(profilePicture && { profilePicture }),
            });
            console.log(`User details updated for UID: ${uid}`);
        } else {
            console.log(`User with UID ${uid} does not exist.`);
        }
    } catch (error) {
        console.error('Error updating user details:', error.message);
    }
};

const deleteAllFirebaseUsers = async () => {
    try {
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            const usersToDelete = listUsersResult.users.map((user) => user.uid);

            if (usersToDelete.length > 0) {
                console.log(`Deleting ${usersToDelete.length} users...`);
                await admin.auth().deleteUsers(usersToDelete);
                console.log('Successfully deleted users.');
            } else {
                console.log('No users to delete.');
            }

            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        console.log('All users have been deleted.');
    } catch (error) {
        console.error('Error deleting users:', error);
    }
};

//PANDADOC API
const createPandaDocDocument = async (booking, product, user) => {
    const url = 'https://api.pandadoc.com/public/v1/documents';

    const documentData = {
        name: `Contract for ${product.name} Booking`,
        template_uuid: process.env.PANDA_DOC_TEST_TEMPLATE_UUID,
        recipients: [
            {
                email: product.user == null ? product.store.email : product.user.email,
                role: 'Lender',
            },
            {
                email: user.email,
                role: 'Renter',
            },
        ],
        tokens: [
            { name: 'product.name', value: product.name },
            { name: 'booking.shortCode', value: booking.shortCode },
            { name: 'booking.quantity', value: booking.quantity },
            {
                name: 'booking.dateAndTime',
                value: convertTimestampToReadableFormat(booking.pickupTime),
            },
            {
                name: 'booking.returnDateAndTime',
                value: convertTimestampToReadableFormat(booking.dropOffTime),
            },
            { name: 'booking.totalAmount', value: `$${booking.totalAmount}` },
            {
                name: 'lender.name',
                value: product.user == null ? product.store.name : product.user.name,
            },
            { name: 'renter.name', value: user.name },
        ],
    };

    try {
        const response = await axios.post(url, documentData, {
            headers: {
                Authorization: `API-Key ${process.env.PANDA_DOC_PROD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error creating PandaDoc document:', error.message);
        return null;
    }
};

const sendPandaDocDocument = async (documentId) => {
    const url = `https://api.pandadoc.com/public/v1/documents/${documentId}/send`;

    const documentData = {
        message: 'This document was sent from the Rentibles.',
    };

    try {
        const response = await axios.post(url, documentData, {
            headers: {
                Authorization: `API-Key ${process.env.PANDA_DOC_PROD_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error sending PandaDoc document:', error.message);
        return null;
    }
};

const handlePandaDocWebhook = async (data) => {
    const { id: documentId, action_by, recipients } = data;
    const signerEmail = action_by?.email;

    if (!documentId || !signerEmail) {
        console.error('Invalid webhook data. Document ID or signer email is missing.');
        return;
    }

    try {
        const booking = await BookingModel.findOne({ documentId });

        if (!booking) {
            console.error(`Booking not found for document ID: ${documentId}`);
            return;
        }

        const isSeller =
            (booking.store && recipients.some((recipient) => recipient.email === signerEmail)) ||
            (booking.user && recipients.some((recipient) => recipient.email === signerEmail));

        const isRenter =
            booking.customer && recipients.some((recipient) => recipient.email === signerEmail);

        if (isSeller) {
            booking.signedBySeller = true;
        } else if (isRenter) {
            booking.signedByRenter = true;
        } else {
            console.error(`Signer email ${signerEmail} does not match the seller or renter.`);
            return;
        }

        if (booking.signedBySeller && booking.signedByRenter) {
            booking.isContractSigned = true;
        }

        await booking.save();

        console.log(`Booking updated successfully for document ID: ${documentId}`);
    } catch (error) {
        console.error('Error handling PandaDoc webhook:', error.message);
    }
};

const completePandaDocContract = async (data) => {
    const { id: documentId } = data;

    if (!documentId) {
        console.error('Invalid webhook data. Document ID is missing.');
        return;
    }

    try {
        const booking = await BookingModel.findOne({ documentId });

        if (!booking) {
            console.error(`Booking not found for document ID: ${documentId}`);
            return;
        }

        booking.isContractSigned = true;

        await booking.save();

        console.log(`Booking updated successfully for document ID: ${documentId}`);
    } catch (error) {
        console.error('Error handling PandaDoc webhook:', error.message);
    }
};

//VERIFF API
const createVeriffSession = async (user) => {
    try {
        const { data } = await axios.post(
            `${process.env.VERIFF_BASE_URL}/v1/sessions`,
            {
                verification: {
                    person: { firstName: user.name },
                    document: { type: 'id_card', country: 'US' },
                },
            },
            {
                headers: {
                    'X-AUTH-CLIENT': process.env.VERIFF_API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );

        return data?.verification?.id || null;
    } catch (error) {
        console.error('Veriff API Error:', error.response?.data || error.message);
        return null;
    }
};

const uploadVeriffMedia = async (sessionId, imageUrl, imageType) => {
    try {
        const { data: imageBuffer } = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
        });

        const base64Image = Buffer.from(imageBuffer, 'binary').toString('base64');
        const payload = {
            image: {
                context: imageType,
                content: `data:image/jpeg;base64,${base64Image}`,
            },
        };

        const signature = generateVeriffHmac(JSON.stringify(payload));

        const { data } = await axios.post(
            `${process.env.VERIFF_BASE_URL}/v1/sessions/${sessionId}/media`,
            payload,
            {
                headers: {
                    'X-AUTH-CLIENT': process.env.VERIFF_API_KEY,
                    'X-HMAC-SIGNATURE': signature,
                    'Content-Type': 'application/json',
                },
            },
        );

        return data || null;
    } catch (error) {
        console.error(
            `Veriff Media Upload Error (${imageType}):`,
            error.response?.data || error.message,
        );
        return null;
    }
};

const submitVeriffSession = async (sessionId) => {
    try {
        const payload = { verification: { status: 'submitted' } };
        const signature = generateVeriffHmac(JSON.stringify(payload));

        const { data } = await axios.patch(
            `${process.env.VERIFF_BASE_URL}/v1/sessions/${sessionId}`,
            payload,
            {
                headers: {
                    'X-AUTH-CLIENT': process.env.VERIFF_API_KEY,
                    'X-HMAC-SIGNATURE': signature,
                    'Content-Type': 'application/json',
                },
            },
        );

        return data || null;
    } catch (error) {
        console.error(`Veriff Session Submission Error:`, error.response?.data || error.message);
        return null;
    }
};

const getSessionDecision = async (sessionId) => {
    try {
        const signature = generateVeriffHmac(sessionId);
        const response = await axios.get(
            `${process.env.VERIFF_BASE_URL}/v1/sessions/${sessionId}/decision`,
            {
                headers: {
                    'X-AUTH-CLIENT': process.env.VERIFF_API_KEY,
                    'X-HMAC-SIGNATURE': signature,
                    'Content-Type': 'application/json',
                },
            },
        );

        const sessionData = response.data;

        console.log(`Veriff Session Data:`, sessionData);

        const { status, reason } = sessionData.verification || {};

        console.log(`Session ${sessionId} Decision: ${status}`);

        if (status === 'approved') {
            console.log(`✅ Session ${sessionId} is approved.`);
        } else if (status === 'declined') {
            console.log(`❌ Session ${sessionId} was declined. Reason: ${reason}`);
        } else {
            console.log(`Session ${sessionId} is still pending.`);
        }

        return sessionData;
    } catch (error) {
        console.error('Error retrieving session decision:', error.response?.data || error.message);
        return null;
    }
};

module.exports = {
    makeDirectories,
    calculateDistance,
    generateNumericOTP,
    createMulter,
    sendEmail,
    sendSignInEmail,
    sendOTPEmail,
    forgetPasswordEmail,
    getTime,
    verifyUID,
    generateToken,
    delay,
    dollarToCents,
    centsToDollars,
    calculateStripeFees,
    calculateApplicationFees,
    generateOrderCode,
    paginate,
    createChatRoom,
    deleteChatRoom,
    addUserDetailsOnFirebase,
    updateUserDetailsOnFirebase,
    deleteAllFirebaseUsers,
    createPandaDocDocument,
    sendPandaDocDocument,
    handlePandaDocWebhook,
    completePandaDocContract,
    deleteUserFromFirebase,
    aggregatePaginate,
    sendOTPToPhone,
    createVeriffSession,
    uploadVeriffMedia,
    submitVeriffSession,
    getSessionDecision,
};
