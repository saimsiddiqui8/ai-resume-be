// const jwt = require('jsonwebtoken');
// const AppError = require('../utils/AppError.js');

// const AdminModel = require('../models/AdminModel.js');
// const LoggedDeviceModel = require('../models/LoggedDeviceModel.js');

// const ProtectRouteMiddleware = (protected = true) =>
//     async (req, res, next) => {
//         try {
//             let token;

//             if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//                 token = req.headers.authorization.split(' ')[1];
//             }

//             if (protected && !token) {
//                 return next(AppError.unauthorized('Unauthorized - Please relogin'));
//             }

//             if (!protected && !token) {
//                 req.session = undefined;
//                 req.auth = undefined;
//                 req.user = {
//                     _id: '66fe7b83c050cda90248110f',
//                     name: 'Guest',
//                     profilePicture: '',
//                 };
//                 return next();
//             }

//             let decoded;
//             try {
//                 decoded = jwt.verify(token, process.env.JWT_SECRET);
//             } catch (error) {
//                 return next(AppError.unauthorized('Unauthorized - Please relogin'));
//             }

//             const loggedDeviceRecord = await LoggedDeviceModel.findOne({
//                 _id: decoded.id,
//             });

//             if (!loggedDeviceRecord) {
//                 return next(AppError.unauthorized('Invalid or expired token provided'));
//             }

//             const signUpRecord = await SignUpModel.findOne({
//                 _id: loggedDeviceRecord.signUpRecord,
//                 isDeleted: false,
//             }).select('+email +password +isDeleted');

//             if (!signUpRecord) {
//                 return next(AppError.unauthorized('No such User found - Access denied'));
//             }

//             if (signUpRecord.role === 'user') {
//                 const userRecord = await UserModel.findOne({
//                     signUpRecord: loggedDeviceRecord.signUpRecord,
//                 }).select(
//                     '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
//                 );

//                 if (!userRecord) {
//                     throw AppError.unauthorized('No such User found - Access denied');
//                 }

//                 req.user = userRecord;
//             } else if (signUpRecord.role === 'admin') {
//                 const adminRecord = await AdminModel.findOne({
//                     signUpRecord: loggedDeviceRecord.signUpRecord,
//                 });

//                 if (!adminRecord) {
//                     throw AppError.unauthorized('No such User found - Access denied');
//                 }

//                 req.user = adminRecord;
//             }

//             req.session = loggedDeviceRecord;
//             req.auth = signUpRecord;

//             next();
//         } catch (error) {
//             next(error);
//         }
//     };

// module.exports = ProtectRouteMiddleware;
