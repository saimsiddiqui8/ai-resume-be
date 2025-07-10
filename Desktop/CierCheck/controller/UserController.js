// const bcrypt = require('bcrypt');
// const AppError = require('../utils/AppError.js');
// const catchAsync = require('../utils/CatchAsync.js');
// const stripe = require('../config/StripeConfig.js');
// const UploadManager = require('../utils/UploadManager.js');

// const SignUpModel = require('../models/SignUpModel.js');

// const { sendAndSaveNotification } = require('./NotificationController.js');
// const { PaginationValidator } = require('../validators/GlobalValidators.js');
// const {
//     paginate,
//     updateUserDetailsOnFirebase,
//     createVeriffSession,
//     uploadVeriffMedia,
//     submitVeriffSession,
//     getSessionDecision,
// } = require('../utils/Helper.js');
// const {
//     CompleteUserProfileValidator,
//     UpdateUserProfileValidator,
// } = require('../validators/UserValidators.js');

// const completeProfile = catchAsync(async (req, res) => {
//     try {
//         await CompleteUserProfileValidator.validateAsync(req.body);
//     } catch (error) {
//         throw new AppError(error.message, 400);
//     }

//     let temp = { uid: req.user.uid };

//     const { phone } = req.body;

//     const tempSignUp = await SignUpModel.findOne({ phone });

//     if (tempSignUp) {
//         const user = await UserModel.findOne({
//             signUpRecord: tempSignUp._id,
//         }).select('+isEmailVerified');
//         if (user?.isEmailVerified) {
//             throw new AppError('Phone already exist, use new instead', 400);
//         }
//     }

//     if (req.body.password) {
//         if (req.auth.password) {
//             throw new AppError('Invalid values provided', 400);
//         } else {
//             const hashedPassword = await bcrypt.hash(req.body.password, 12);
//             await SignUpModel.findOneAndUpdate(
//                 { _id: req.auth._id },
//                 { password: hashedPassword },
//                 { new: true },
//             );
//         }
//     }

//     if (req.body.name) {
//         temp.name = req.body.name;
//     }

//     const { longitude, latitude } = req.body;

//     if (req.file) {
//         const profileUpload = await UploadManager.upload({
//             key: `pictures`,
//             fileReference: req.file.path,
//             contentType: 'image',
//             fileName: req.file.filename,
//             shouldChangeFileName: false,
//         });

//         req.body.profilePicture = profileUpload.Location;
//         temp.profilePicture = profileUpload.Location;
//     }

//     req.body.location = {
//         type: 'Point',
//         coordinates: [parseFloat(longitude), parseFloat(latitude)],
//     };

//     const user = await UserModel.findOneAndUpdate(
//         { _id: req.user._id },
//         { ...req.body, isProfileCompleted: true },
//         { new: true },
//     )
//         .select(
//             '+signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId',
//         )
//         .lean();
//     //Updating User on Firebase
//     await updateUserDetailsOnFirebase(temp);

//     return res.status(200).json({
//         success: true,
//         message: 'User profile completed successfully',
//         data: { user },
//     });
// });

// const verifyIdentity = catchAsync(async (req, res) => {
//     if (!req.user.isEmailVerified || !req.user.isPhoneVerified || !req.user.isProfileCompleted) {
//         throw new AppError('Unauthorized! Profile incomplete.', 401);
//     }

//     // || !req.files?.face

//     if (!req.files?.front || !req.files?.back) {
//         throw new AppError('Missing required parameters', 400);
//     }

//     // faceUpload
//     const [frontUpload, backUpload] = await Promise.all([
//         UploadManager.upload({
//             key: 'pictures',
//             fileReference: req.files.front[0].path,
//             contentType: 'image',
//             fileName: req.files.front[0].filename,
//             shouldChangeFileName: false,
//         }),
//         UploadManager.upload({
//             key: 'pictures',
//             fileReference: req.files.back[0].path,
//             contentType: 'image',
//             fileName: req.files.back[0].filename,
//             shouldChangeFileName: false,
//         }),
//         // UploadManager.upload({
//         //   key: "pictures",
//         //   fileReference: req.files.face[0].path,
//         //   contentType: "image",
//         //   fileName: req.files.face[0].filename,
//         //   shouldChangeFileName: false,
//         // }),
//     ]);

//     let sessionId = req.user.veriffSessionId;

//     if (!sessionId) {
//         sessionId = await createVeriffSession(req.user);

//         if (!sessionId) {
//             throw new AppError('Failed to create Veriff session', 400);
//         }

//         await UserModel.findByIdAndUpdate(req.user._id, {
//             veriffSessionId: sessionId,
//         });
//     }

//     const uploadResults = await Promise.allSettled([
//         uploadVeriffMedia(sessionId, frontUpload.Location, 'document-front'),
//         uploadVeriffMedia(sessionId, backUpload.Location, 'document-back'),
//         // uploadVeriffMedia(sessionId, faceUpload.Location, "face"),
//     ]);

//     const failedUploads = uploadResults.filter((result) => result.status === 'rejected');

//     if (failedUploads.length > 0) {
//         throw new AppError('Failed to upload verification media', 400);
//     }

//     const submissionResponse = await submitVeriffSession(sessionId);

//     if (!submissionResponse) {
//         throw new AppError('Failed to submit Veriff session', 400);
//     }

//     await UserModel.findByIdAndUpdate(req.user._id, {
//         identityStatus: 'approved',
//         idFrontImage: frontUpload.Location,
//         idBackImage: backUpload.Location,
//     });

//     return res.status(200).json({
//         success: true,
//         message: 'User identity submitted successfully',
//         data: { identityStatus: 'approved' },
//     });
// });

// const becomeSeller = catchAsync(async (req, res) => {
//     if (
//         !req.user.isEmailVerified ||
//         !req.user.isPhoneVerified ||
//         !req.user.isProfileCompleted ||
//         req.user.identityStatus !== 'approved'
//     ) {
//         throw new AppError('Unauthorized! Profile incomplete.', 401);
//     }

//     let accountLink;

//     if (req.user.stripeAccountId) {
//         accountLink = await stripe.accountLinks.create({
//             account: req.user.stripeAccountId,
//             refresh_url: 'https://www.rentibles.com/refresh',
//             return_url: 'https://www.rentibles.com/success',
//             type: 'account_onboarding',
//         });
//     } else {
//         const account = await stripe.accounts.create({
//             country: 'US',
//             type: 'custom',
//             capabilities: {
//                 card_payments: {
//                     requested: true,
//                 },
//                 transfers: {
//                     requested: true,
//                 },
//             },
//             settings: {
//                 payouts: {
//                     schedule: {
//                         interval: 'manual',
//                     },
//                 },
//             },
//         });

//         accountLink = await stripe.accountLinks.create({
//             account: account.id,
//             refresh_url: 'https://www.rentibles.com/refresh',
//             return_url: 'https://www.rentibles.com/success',
//             type: 'account_onboarding',
//         });

//         await UserModel.findOneAndUpdate(
//             { _id: req.user._id },
//             { stripeAccountId: account.id },
//             { new: true },
//         );
//     }

//     return res.status(200).json({
//         success: true,
//         message: 'Stripe link retrived successfully',
//         data: accountLink,
//     });
// });

// const updateProfile = catchAsync(async (req, res) => {
//     if (req.user.isDeactivatedByAdmin) {
//         throw new AppError('You have been blocked by admin, Cannot update profile.', 400);
//     }

//     try {
//         await UpdateUserProfileValidator.validateAsync(req.body);
//     } catch (error) {
//         throw new AppError(error.message, 400);
//     }

//     let temp = { uid: req.user.uid };
//     let notificationTitle = 'Profile Updated';
//     let notificationMessage = 'Profile Updated Successfully';

//     if (req.file) {
//         const profileUpload = await UploadManager.upload({
//             key: `pictures`,
//             fileReference: req.file.path,
//             contentType: 'image',
//             fileName: req.file.filename,
//             shouldChangeFileName: false,
//         });

//         req.body.profilePicture = profileUpload.Location;
//         temp.profilePicture = profileUpload.Location;
//     }

//     if (req.body?.phone) {
//         const tempSignUp = await SignUpModel.findOne({
//             phone: req.body.phone,
//             isDeleted: false,
//         });

//         if (tempSignUp) {
//             throw new AppError('Phone number already exist', 400);
//         }

//         await SignUpModel.findOneAndUpdate(
//             { _id: req.auth._id },
//             { phone: req.body.phone },
//             { new: true },
//         );

//         req.body.isPhoneVerified = false;

//         notificationTitle = 'Phone Updated';
//         notificationMessage = 'Phone number updated successfully';
//     }

//     if (req.body?.latitude && req.body?.longitude) {
//         req.body.location = {
//             type: 'Point',
//             coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
//         };
//     }

//     if (req.body?.name) {
//         temp.name = req.body.name;
//     }

//     const updatedUser = await UserModel.findOneAndUpdate(
//         { _id: req.user._id },
//         { ...req.body },
//         { new: true },
//     );

//     //Updating User on Firebase
//     await updateUserDetailsOnFirebase(temp);

//     sendAndSaveNotification(notificationTitle, notificationMessage, req.auth._id, {
//         data: JSON.stringify({
//             type: 'user',
//             user: {
//                 _id: updatedUser._id,
//                 name: updatedUser.name,
//                 profilePicture: updatedUser.profilePicture,
//             },
//         }),
//     });

//     return res.status(200).json({
//         success: true,
//         message: 'User profile updated successfully',
//     });
// });

// const getUser = catchAsync(async (req, res) => {
//     const { userId } = req.query;
//     const currentUserId = req.user._id;

//     const id = userId && /^[0-9a-fA-F]{24}$/.test(userId) ? userId : currentUserId;

//     if (!id || (currentUserId === '66fe7b83c050cda90248110f' && !userId)) {
//         throw new AppError('Unauthorized - Please login', 401);
//     }

//     const result = await UserModel.findOne({ _id: id })
//         .select(
//             '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
//         )
//         .lean();

//     if (!result) {
//         throw new AppError('User not found', 400);
//     }

//     const isOwn = id == currentUserId;
//     const user = isOwn ? ownUserParser(result) : userParser(result);
//     user.isOwn = isOwn;

//     return res.status(200).json({
//         success: true,
//         message: 'User profile retrieved successfully',
//         data: user,
//     });
// });

// const getUsers = catchAsync(async (req, res) => {
//     try {
//         await PaginationValidator.validateAsync(req.query);
//     } catch (error) {
//         throw new AppError(error.message, 400);
//     }

//     const { page = 1, limit = 10, search } = req.query;

//     let query = {
//         _id: { $nin: [req.user._id] },
//         isEmailVerified: true,
//         isDeleted: false,
//     };

//     if (search) {
//         query.$or = [
//             { name: { $regex: search, $options: 'i' } },
//             // { email: { $regex: search, $options: 'i' } }
//         ];
//     }

//     const { skip, pagination } = await paginate(UserModel, query, page, limit);

//     const result = await UserModel.find(query)
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .skip(skip)
//         .lean();

//     const users = result.map((user) => userParser(user));

//     return res.status(200).json({
//         success: true,
//         message: 'Users retrieved successfully',
//         data: users,
//         pagination,
//     });
// });

// const getBalance = catchAsync(async (req, res) => {
//     const balance = await stripe.balance.retrieve(req.user.stripeAccountId);

//     const amount = balance.available[0].amount;

//     return res.status(200).json({
//         success: true,
//         message: 'Balance retrieved successfully',
//         data: amount,
//     });
// });

// const userParser = (obj) => {
//     const temp = {
//         _id: obj._id,
//         name: obj.name,
//         email: obj.email,
//         profilePicture: obj.profilePicture,
//         createdAt: obj.createdAt,
//         updatedAt: obj.updatedAt,
//     };
//     return temp;
// };

// const ownUserParser = (obj) => {
//     const temp = {
//         _id: obj._id,
//         name: obj.name,
//         email: obj.email,
//         profilePicture: obj.profilePicture,
//         phone: obj.phone,
//         country: obj.country,
//         address: obj.address,
//         apartment: obj.apartment,
//         city: obj.city,
//         state: obj.state,
//         zipCode: obj.zipCode,
//         location: obj.location,
//         identityStatus: obj.identityStatus,
//         isEmailVerified: obj.isEmailVerified,
//         isPhoneVerified: obj.isPhoneVerified,
//         isProfileCompleted: obj.isProfileCompleted,
//         stripeProfileStatus: obj.stripeProfileStatus,
//         stripeAccountId: obj.stripeAccountId,
//         idFrontImage: obj?.idFrontImage ?? null,
//         idBackImage: obj?.idBackImage ?? null,
//         isOwn: obj.isOwn ?? false,
//         createdAt: obj.createdAt,
//         updatedAt: obj.updatedAt,
//     };
//     return temp;
// };

// module.exports = {
//     getUsers,
//     getUser,
//     completeProfile,
//     updateProfile,
//     verifyIdentity,
//     becomeSeller,
//     getBalance,
//     userParser,
// };
