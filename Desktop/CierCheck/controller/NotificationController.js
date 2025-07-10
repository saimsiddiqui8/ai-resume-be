// const AppError = require('../utils/AppError.js');
// const catchAsync = require('../utils/CatchAsync.js');

// const SettingsModel = require('../models/SettingsModel.js');
// const LoggedDeviceModel = require('../models/LoggedDeviceModel.js');
// const NotificationModel = require('../models/NotificationModel.js');
// const NotificationContentModel = require('../models/NotificationContentModel.js');

// const { paginate } = require('../utils/Helper.js');
// const { admin } = require('./../config/FirebaseConfig.js');
// const { PaginationValidator } = require('../validators/GlobalValidators.js');
// const {
//     CreateNotificationValidator,
//     ReadNotificationValidator,
//     DeleteNotificationValidator,
//     SendNotificationValidator,
// } = require('../validators/NotificationValidators.js');

// const createNotification = catchAsync(async (req, res) => {
//     try {
//         await CreateNotificationValidator.validateAsync(req.body);
//     } catch (error) {
//         throw AppError.badRequest(error.message);
//     }

//     const { title, description } = req.body;

//     const [userRecords] = await Promise.all([
//         UserModel.find({ isEmailVerified: true }).select('signUpRecord'),
//     ]);

//     const userSignUpRecords = userRecords
//         .map((record) => record.signUpRecord)
//         .filter((record) => record != null);

//     const signUpRecords = [...userSignUpRecords];

//     await sendAndSaveNotification(
//         title,
//         description,
//         signUpRecords,
//         { data: JSON.stringify({}) },
//         true,
//     );

//     return res.status(200).json({
//         success: true,
//         message: 'Notification created successfully',
//     });
// });

// const sendNotification = catchAsync(async (req, res) => {
//     try {
//         await SendNotificationValidator.validateAsync(req.body);
//     } catch (error) {
//         throw AppError.badRequest(error.message);
//     }

//     const { user, chatId, title, description } = req.body;

//     const [userRecords] = await Promise.all([
//         UserModel.find({ uid: user.uid }).select('+signUpRecord'),
//     ]);

//     const userSignUpRecords = userRecords
//         .map((record) => record.signUpRecord)
//         .filter((record) => record != null);

//     const signUpRecords = [...userSignUpRecords];

//     await sendAndSaveNotification(
//         req.user.name,
//         description,
//         signUpRecords,
//         {
//             data: JSON.stringify({
//                 type: 'chat',
//                 chatUser: {
//                     _id: req.user._id,
//                     phone: req.user.phone,
//                     email: req.user.email,
//                     name: req.user.name,
//                     profilePicture: req.user.profilePicture,
//                     uid: req.user.uid,
//                     chatId: chatId,
//                 },
//             }),
//         },
//         false,
//         true,
//     );

//     return res.status(200).json({
//         success: true,
//         message: 'Notification sent successfully',
//     });
// });

// const getUserNotifications = catchAsync(async (req, res) => {
//     try {
//         await PaginationValidator.validateAsync(req.query);
//     } catch (error) {
//         throw AppError.badRequest(error.message);
//     }

//     const { page = 1, limit = 10, filter = 'all' } = req.query;

//     if (filter !== 'all' && filter !== 'read' && filter !== 'unread') {
//         throw AppError.badRequest('Invalid value provided for filter');
//     }

//     const query = req.auth.role === 'user' ? { user: req.user._id } : { store: req.user._id };

//     if (filter === 'read') {
//         query.isRead = true;
//     } else if (filter === 'unread') {
//         query.isRead = false;
//     }

//     const { skip, pagination } = await paginate(NotificationModel, query, page, limit);

//     const [result, unreadCount] = await Promise.all([
//         NotificationModel.find(query)
//             .populate('notificationContent')
//             .sort({ createdAt: -1 })
//             .limit(limit)
//             .skip(skip),
//         NotificationModel.countDocuments(
//             req.auth.role === 'user'
//                 ? { user: req.user._id, isRead: false }
//                 : { store: req.user._id, isRead: false },
//         ),
//     ]);

//     const notifications = result.map((item) => notificationParser(item));

//     return res.status(200).json({
//         success: true,
//         message: 'Notification created successfully',
//         data: notifications,
//         unreadCount,
//         pagination,
//     });
// });

// const readNotification = catchAsync(async (req, res) => {
//     try {
//         await ReadNotificationValidator.validateAsync(req.body);
//     } catch (error) {
//         throw AppError.badRequest(error.message);
//     }

//     const { notificationId } = req.body;

//     const query = {
//         _id: notificationId,
//         user: req.user._id,
//     };

//     const notification = await NotificationModel.findOneAndUpdate(
//         query,
//         { isRead: true },
//         { new: true },
//     );

//     if (!notification) {
//         throw AppError.notFound('Notification not found');
//     }

//     return res.status(200).json({
//         success: true,
//         message: 'Notification marked as read successfully',
//     });
// });

// const readAllNotification = catchAsync(async (req, res) => {
//     const query = { user: req.user._id };
//     await NotificationModel.updateMany(query, { isRead: true });

//     return res.status(200).json({
//         success: true,
//         message: 'All notifications marked as read successfully',
//     });
// });

// const deleteNotification = catchAsync(async (req, res) => {
//     try {
//         await DeleteNotificationValidator.validateAsync(req.params);
//     } catch (error) {
//         throw AppError.badRequest(error.message);
//     }

//     const { notificationId } = req.params;

//     const query = {
//         _id: notificationId,
//         user: req.user._id,
//     };

//     const notification = await NotificationModel.findOneAndDelete(query);

//     if (!notification) {
//         throw AppError.notFound('Notification not found');
//     }

//     return res.status(200).json({
//         success: true,
//         message: 'Notification deleted successfully',
//     });
// });

// const deleteAllNotification = catchAsync(async (req, res) => {
//     const query = {
//         user: req.user._id,
//     };

//     await NotificationModel.deleteMany(query);

//     return res.status(200).json({
//         success: true,
//         message: 'All Notification deleted successfully',
//     });
// });

// const sendAndSaveNotification = async (
//     title,
//     description,
//     signUpRecords,
//     metaData = {},
//     isAdmin = false,
//     skip = false,
// ) => {
//     try {
//         const notificationContent = await NotificationContentModel.create({
//             title,
//             description,
//             metaData,
//             isAdmin,
//         });

//         const [users] = await Promise.all([
//             UserModel.find({ signUpRecord: { $in: signUpRecords } }).select('_id'),
//         ]);

//         const userIds = users.map((user) => user._id);

//         if (!skip) {
//             await saveNotifications({
//                 notificationContentId: notificationContent._id,
//                 userIds,
//             });
//         }

//         const [userSettings] = await Promise.all([
//             SettingsModel.find({
//                 user: { $in: userIds },
//                 notification: true,
//             }).populate({ path: 'user', select: 'signUpRecord' }),
//         ]);

//         const filteredSignUpRecords = [
//             ...userSettings.map((setting) => setting.user?.signUpRecord).filter(Boolean),
//         ];

//         console.log('Filtered Sign Up Records Length =>', filteredSignUpRecords.length);

//         const loggedDevices = await LoggedDeviceModel.find({
//             signUpRecord: { $in: filteredSignUpRecords },
//         }).select('fcmToken');

//         const fcmTokens = loggedDevices.map((device) => device.fcmToken).filter(Boolean);

//         console.log('Token length =>', fcmTokens.length);

//         if (fcmTokens.length > 0) {
//             const payload = {
//                 notification: {
//                     title,
//                     body: description,
//                 },
//                 data: metaData,
//                 android: {
//                     notification: {
//                         sound: 'default',
//                     },
//                 },
//                 apns: {
//                     payload: {
//                         aps: {
//                             sound: 'default',
//                         },
//                     },
//                 },
//                 tokens: fcmTokens,
//             };
//             await admin.messaging().sendEachForMulticast(payload);
//         }
//     } catch (error) {
//         console.error(`Error in sending and saving notification: ${error.message}`);
//     }
// };

// const saveNotifications = async ({ notificationContentId, userIds }) => {
//     try {
//         const notifications = [];

//         userIds.forEach((userId) => {
//             notifications.push({
//                 notificationContent: notificationContentId,
//                 user: userId,
//                 isRead: false,
//             });
//         });

//         if (notifications.length > 0) {
//             await NotificationModel.insertMany(notifications);
//         }
//     } catch (error) {
//         throw AppError.badRequest(`Error saving notifications: ${error.message}`);
//     }
// };

// const notificationParser = (obj) => {
//     const temp = {
//         _id: obj._id,
//         title: obj.notificationContent.title,
//         description: obj.notificationContent.description,
//         metaData: obj.notificationContent?.metaData?.data
//             ? JSON.parse(obj.notificationContent?.metaData?.data)
//             : {},
//         isRead: obj.isRead,
//         createdAt: obj.createdAt,
//         updatedAt: obj.updatedAt,
//     };
//     return temp;
// };

// module.exports = {
//     createNotification,
//     getUserNotifications,
//     readNotification,
//     readAllNotification,
//     deleteNotification,
//     deleteAllNotification,
//     sendAndSaveNotification,
//     sendNotification,
// };
