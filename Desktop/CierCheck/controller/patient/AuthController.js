const bcrypt = require('bcrypt');
const AppError = require('../../utils/AppError.js');
const catchAsync = require('../../utils/CatchAsync.js');
const UploadManager = require('../../utils/UploadManager.js');

const OTPModel = require('../../models/OTPModel.js');
const PatientModel = require('../../models/PatientModel.js');
const AdminModel = require('../../models/AdminModel.js');
const SettingsModel = require('../../models/SettingsModel.js');
const LoggedDeviceModel = require('../../models/LoggedDeviceModel.js');

const { getAuth } = require('firebase-admin/auth');
const { admin } = require('../../config/FirebaseConfig.js');
const { sendAndSaveNotification } = require('../../controller/NotificationController.js');
const {
    generateToken,
    verifyUID,
    generateNumericOTP,
    addUserDetailsOnFirebase,
    deleteUserFromFirebase,
    sendOTPToPhone,
    sendOTPEmail,
    forgetPasswordEmail,
} = require('../../utils/Helper.js');
const {
    ChangePasswordValidator,
    UpdatePasswordValidator,
    VerifyOtpValidator,
} = require('../../validators/UserValidators.js');
const {
    EmailSignInValidator,
    EmailSignUpValidator,
    SocialRegisterValidator,
    OtpValidator,
    UpdateFCMValidator,
    ForgotPasswordValidator,
    DeleteAccountValidator,
    CheckEmailValidator,
} = require('../../validators/AuthValidators.js');

const patientSignUp = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { email, phone, password, firstName, lastName, username, fcmToken } = req.body;
    const { deviceuniqueid, devicemodel } = req.headers;

    // Check if user already exists
    const existingUser = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    });
    if (existingUser) {
        throw AppError.badRequest('User already exists. Please sign in.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new patient
    const patient = await PatientModel.create({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword
    });

    // Create device record
    await LoggedDeviceModel.create({
        patient: patient._id,
        deviceIdentity: deviceuniqueid,
        fcmToken,
        deviceModel: devicemodel,
        ipAddress: ip,
        userAgent,
    });

    // Generate token
    const token = generateToken(patient._id, 'patient');

    return res.status(201).json({
        success: true,
        message: 'User signed up successfully',
        data: {
            token,
            user,
        },
    });
};

const emailSignIn = catchAsync(async (req, res) => {

    const data = {};
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { email, password, role } = req.body;
    const { deviceuniqueid, devicemodel } = req.headers;

    const user = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    }).select(
        '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
    );

    if (!user || !user.isEmailVerified) {
        throw new AppError.badRequest('User does not exist, Sign Up instead');
    }

    data.user = user;

    await LoggedDeviceModel.findOneAndDelete({ deviceIdentity: deviceuniqueid });

    const loggedDevice = await LoggedDeviceModel.create({
        signUpRecord: user.signUpRecord,
        deviceIdentity: deviceuniqueid,
        deviceModel: devicemodel,
        ipAddress: ip,
        userAgent,
    });

    data.token = generateToken({ id: loggedDevice._id });

    return res.status(200).json({
        success: true,
        message: `${role} logged in successfully`,
        data,
    });
});

const socialRegister = catchAsync(async (req, res) => {
    try {
        await SocialRegisterValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    let token;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { idToken, role } = req.body;
    const { deviceuniqueid, devicemodel } = req.headers;

    let decodedToken;
    try {
        decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
        throw AppError.badRequest('Invalid firebase token');
    }

    if (!decodedToken) {
        throw AppError.badRequest('Invalid firebase token');
    }

    const firebaseUser = await verifyUID(decodedToken.uid);

    const email = firebaseUser?.email;

    const user = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    }).select(
        '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
    );

    if (user) {
        const [loggedDevice] = await Promise.all([
            LoggedDeviceModel.findOneAndDelete({ deviceIdentity: deviceuniqueid }),
        ]);

        const loggedDevice = await LoggedDeviceModel.create({
            signUpRecord: user.signUpRecord,
            deviceIdentity: deviceuniqueid,
            deviceModel: devicemodel,
            ipAddress: ip,
            userAgent,
        });

        token = generateToken({ id: loggedDevice._id });

        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            data: {
                token,
                user,
            },
        });
    }

    const newUser = await PatientModel.create({
        email,
        uid: decodedToken.uid,
        isEmailVerified: true,
    });

    await LoggedDeviceModel.findOneAndDelete({ deviceIdentity: deviceuniqueid });

    const loggedDevice = await LoggedDeviceModel.create({
        signUpRecord: newUser.signUpRecord,
        deviceIdentity: deviceuniqueid,
        deviceModel: devicemodel,
        ipAddress: ip,
        userAgent,
    });

    token = generateToken({ id: loggedDevice._id });

    //Creating User on Firebase
    SettingsModel.create({ user: newUser._id });
    await addUserDetailsOnFirebase({
        _id: newUser._id,
        uid: decodedToken.uid,
        name: '',
        email: email.toLowerCase(),
        profilePicture: '',
        role,
    });

    return res.status(201).json({
        success: true,
        message: 'User signed up successfully',
        data: {
            token,
            user: newUser,
        },
    });
});

const verifyOTP = catchAsync(async (req, res) => {
    try {
        await OtpValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    let user;
    const { email, otp, role } = req.body;

    const signUp = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    }).select(
        '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
    );
    if (!signUp) {
        throw AppError.notFound('User does not exist');
    }
    user = signUp;

    const tempOtp = await OTPModel.findOne({
        signUpRecord: signUp._id,
        type: 'email',
    });

    if (!tempOtp) {
        throw AppError.notFound('User Not Found');
    }

    if (Date.now() > tempOtp.updatedAt.getTime() + 2 * 60 * 1000 || tempOtp.otp != otp) {
        throw AppError.badRequest('Invalid or Expired OTP');
    }

    let loggedDevice = await LoggedDeviceModel.findOne({
        signUpRecord: signUp._id,
    });

    if (loggedDevice) {
        await LoggedDeviceModel.findOneAndDelete({ signUpRecord: signUp._id });
    }

    loggedDevice = await LoggedDeviceModel.create({ signUpRecord: signUp._id });

    const payload = { id: loggedDevice._id };
    const authToken = generateToken(payload);

    user = await PatientModel.findOneAndUpdate(
        { _id: user._id },
        { isEmailVerified: true },
        { new: true },
    ).select(
        '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
    );

    return res.status(200).json({
        success: true,
        message: 'OTP Verified Successfully',
        data: {
            token: authToken,
            user,
        },
    });
});

const sendEmailVerificationOTP = catchAsync(async (req, res) => {
    const otp = await OTPModel.findOne({
        signUpRecord: req.auth._id,
        type: 'email',
    });

    const OTP = generateNumericOTP();

    if (!otp) {
        await OTPModel.create({
            signUpRecord: req.auth._id,
            otp: OTP,
            type: 'email',
        });
    } else {
        await OTPModel.updateOne({ _id: otp._id }, { otp: OTP }, { new: true });
    }

    await sendOTPEmail(req.user.name, req.user.email, OTP);

    return res.status(200).json({
        success: true,
        message: 'OTP Sent to Email Successfully',
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    try {
        await VerifyOtpValidator.validateAsync(req.body);
    } catch (error) {
        throw new AppError(error.message, 400);
    }

    const users = await PatientModel.find({
        email: req.user.email,
        isEmailVerified: true,
        isDeleted: false,
    });

    if (users && users.length > 0) {
        throw AppError.badRequest('Email already taken');
    }

    const { otp } = req.body;

    const tempOtp = await OTPModel.findOne({
        signUpRecord: req.auth._id,
        type: 'email',
    });

    if (!tempOtp) {
        throw new AppError('Invalid OTP provided', 400);
    }

    if (Date.now() > tempOtp.updatedAt.getTime() + 2 * 60 * 1000 || tempOtp.otp != otp) {
        throw new AppError('Invalid or Expired OTP', 400);
    }

    await PatientModel.findOneAndUpdate(
        { _id: req.user._id },
        { isEmailVerified: true },
        { new: true },
    );

    //Creating User on Firebase
    await addUserDetailsOnFirebase({
        _id: req.user._id,
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        role: req.auth.role,
    });
    const newSettings = { user: req.user._id };
    SettingsModel.create(newSettings);

    return res.status(200).json({
        success: true,
        message: 'Email Verified Successfully',
    });
});

const sendPhoneVerificationOTP = catchAsync(async (req, res) => {
    const otp = await OTPModel.findOne({
        signUpRecord: req.auth._id,
        type: 'phone',
    });

    const OTP = generateNumericOTP();

    if (!otp) {
        await OTPModel.create({
            signUpRecord: req.auth._id,
            otp: OTP,
            type: 'phone',
        });
    } else {
        await OTPModel.updateOne({ _id: otp._id }, { otp: OTP }, { new: true });
    }

    //Send OTP To Phone
    const isSent = await sendOTPToPhone(req.auth.phone, OTP);

    if (!isSent) {
        throw AppError.badRequest('Error sending OTP to phone');
    }

    return res.status(200).json({
        success: true,
        message: 'OTP Sent to Phone Successfully',
    });
});

const verifyPhone = catchAsync(async (req, res) => {
    try {
        await VerifyOtpValidator.validateAsync(req.body);
    } catch (error) {
        throw new AppError(error.message, 400);
    }

    const { otp } = req.body;

    const users = await PatientModel.find({
        phone: req.user.phone,
        isPhoneVerified: true,
        isDeleted: false,
    });

    if (users && users.length > 0) {
        throw new AppError('Phone number already taken', 400);
    }

    const tempOtp = await OTPModel.findOne({
        signUpRecord: req.auth._id,
        type: 'phone',
    });

    if (!tempOtp) {
        throw new AppError('Invalid OTP provided', 400);
    }

    if (Date.now() > tempOtp.updatedAt.getTime() + 2 * 60 * 1000 || tempOtp.otp != otp) {
        throw new AppError('Invalid or Expired OTP', 400);
    }

    await PatientModel.findOneAndUpdate(
        { _id: req.user._id },
        { isPhoneVerified: true },
        { new: true },
    );

    return res.status(200).json({
        success: true,
        message: 'Phone Verified Successfully',
    });
});

const checkEmail = catchAsync(async (req, res) => {
    try {
        await CheckEmailValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { email, role } = req.body;

    const user = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    }).select(
        '+idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId ++idFrontImage +idBackImage +signUpRecord +isEmailVerified +isPhoneVerified +identityStatus +isSeller +isProfileCompleted +stripeProfileStatus +stripeAccountId +isDeactivatedByAdmin +isDeleted',
    );

    if (user && !user.isEmailVerified) {
        const tempUser = await admin.auth().getUser(user.uid);
        if (tempUser) {
            await admin.auth().deleteUser(user.uid);
        }
    }

    return res.status(200).json({
        success: true,
        message: 'Email checked Successfully',
    });
});

const forgotPassword = catchAsync(async (req, res) => {
    try {
        await ForgotPasswordValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { email, role } = req.body;

    let user = {
        name: 'Admin',
    };

    const signUp = await PatientModel.findOne({
        email: email.toLowerCase(),
        isDeleted: false,
    });

    if (!signUp) {
        throw new AppError('User Not Found', 404);
    }

    if (role === 'user') {
        user = await PatientModel.findOne({
            email: email.toLowerCase(),
            isDeleted: false,
        });
        if (!user) {
            throw new AppError('User does not exist', 404);
        }
    }

    const otp = await OTPModel.findOne({
        signUpRecord: signUp._id,
        type: 'email',
    });

    const OTP = generateNumericOTP();

    if (!otp) {
        await OTPModel.create({
            signUpRecord: signUp._id,
            otp: OTP,
            type: 'email',
        });
    } else {
        await OTPModel.updateOne({ _id: otp._id }, { otp: OTP }, { new: true });
    }

    await forgetPasswordEmail(user.name, email, OTP);

    return res.status(200).json({
        success: true,
        message: 'OTP Sent Successfully',
    });
});

const updatePassword = catchAsync(async (req, res) => {
    try {
        await UpdatePasswordValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);

    await PatientModel.findOneAndUpdate(
        { _id: req.auth._id },
        { password: hashedPassword },
        { new: true },
    );

    await admin.auth().updateUser(req.user.uid, {
        password: password,
    });

    sendAndSaveNotification('Password Updated', 'Password updated successfully.', req.auth._id, {
        data: JSON.stringify({
            type: 'user',
            user: {
                _id: req.user._id,
                name: req.user.name,
                profilePicture: req.user.profilePicture,
            },
        }),
    });

    return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
    });
});

const changePassword = catchAsync(async (req, res) => {
    if (req.user.isDeactivatedByAdmin) {
        throw AppError.badRequest('You have been blocked by admin, Cannot change your password.');
    }

    try {
        await ChangePasswordValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { password, newPassword } = req.body;

    const signUpRecord = await PatientModel.findOne({
        _id: req.auth._id,
        isDeleted: false,
    }).select('+password');

    if (!(await bcrypt.compare(password, signUpRecord.password))) {
        throw AppError.badRequest('Invalid password provided');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await PatientModel.findOneAndUpdate(
        { _id: req.auth._id },
        { password: hashedPassword },
        { new: true },
    );

    await admin.auth().updateUser(req.user.uid, {
        password: newPassword,
    });

    sendAndSaveNotification('Password Updated', 'Password updated successfully.', req.auth._id, {
        data: JSON.stringify({
            type: 'user',
            user: {
                _id: req.user._id,
                name: req.user.name,
                profilePicture: req.user.profilePicture,
            },
        }),
    });

    return res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});

const updateFCMToken = catchAsync(async (req, res) => {
    try {
        await UpdateFCMValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { fcmToken } = req.body;

    await LoggedDeviceModel.findOneAndUpdate({ _id: req.session._id }, { fcmToken }, { new: true });

    return res.status(200).json({
        success: true,
        message: 'Fcm token updated successfully',
    });
});

const logout = catchAsync(async (req, res) => {
    await LoggedDeviceModel.findOneAndDelete({ _id: req.session._id });

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

const deleteAccount = catchAsync(async (req, res) => {
    try {
        await DeleteAccountValidator.validateAsync(req.body);
    } catch (error) {
        throw AppError.badRequest(error.message);
    }

    const { password } = req.body;

    if (!(await bcrypt.compare(password, req.auth.password))) {
        throw AppError.badRequest('Invalid password provided');
    }

    await Promise.all([
        LoggedDeviceModel.deleteMany({ signUpRecord: req.auth._id }),
        PatientModel.findOneAndUpdate({ _id: req.user._id }, { isDeleted: true }, { new: true }),
        deleteUserFromFirebase(req.user.uid),
    ]);

    return res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
    });
});

module.exports = {
    emailSignUp,
    emailSignIn,
    socialRegister,
    sendEmailVerificationOTP,
    verifyEmail,
    sendPhoneVerificationOTP,
    verifyPhone,
    verifyOTP,
    forgotPassword,
    updatePassword,
    changePassword,
    updateFCMToken,
    logout,
    deleteAccount,
    checkEmail,
};
