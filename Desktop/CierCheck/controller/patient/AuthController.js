const bcrypt = require('bcryptjs');
const AppError = require('../../utils/AppError.js');
const UploadManager = require('../../utils/UploadManager.js');
const UserModel = require('../../models/UserModel.js');
const LoggedDeviceModel = require('../../models/LoggedDeviceModel.js');
const {
    generateToken,
    sendOTPEmail,
} = require('../../utils/Helper.js');
const jwt = require('jsonwebtoken');
const OTPModel = require('../../models/OTPModel.js');

exports.socialAuth = async (req, res) => {
    const { idToken } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { deviceuniqueid, devicemodel } = req.headers;

    const payload = jwt.decode(idToken);
    console.log(payload, "payload>>>>>>");
    if (!payload || !payload.email) throw AppError.badRequest('Invalid ID token');

    let patient;

    patient = await UserModel.findOne({
        email: payload.email.toLowerCase(),
        role: 'patient',
    });

    if (patient && patient.isDeleted) {
        if (patient.reactivateAt && patient.reactivateAt <= new Date()) {
            patient.isDeleted = false;
            patient.reactivateAt = null;
            await patient.save();

        } else {
            throw AppError.forbidden(`Account temporarily deactivated until ${patient.reactivateAt.toLocaleString()}`);
        }
    }

    const existedDoctor = await UserModel.findOne({ email: payload.email.toLowerCase(), role: "doctor" });
    if (existedDoctor) throw AppError.badRequest('Email already exists for a doctor');

    if (!patient) {
        // New user registration
        patient = await UserModel.create({
            firstName: 'Cier Check',
            lastName: 'User',
            dateOfBirth: '',
            email: payload.email.toLowerCase(),
            profilePicURL: payload.picture || '',
            role: 'patient',
        });

        await LoggedDeviceModel.findOneAndUpdate(
            { user: patient._id },
            {
                user: patient._id,
                deviceUniqueId: deviceuniqueid,
                deviceModel: devicemodel,
                ipAddress: ip,
                userAgent: userAgent,
            },
            { upsert: true, new: true },
        );
        const token = generateToken({ user: patient._id, role: 'patient' });

        return res.status(201).json({
            success: true,
            message: 'User signed up successfully',
            data: {
                token,
                patient,
                isUsernameAdded: patient.username ? true : false,
                isUserDetailsFilled: patient.bio ? true : false,
            },
        });
    }

    await LoggedDeviceModel.findOneAndUpdate(
        { user: patient._id },
        {
            user: patient._id,
            deviceUniqueId: deviceuniqueid,
            deviceModel: devicemodel,
            ipAddress: ip,
            userAgent: userAgent,
        },
        { upsert: true },
    );

    const token = generateToken({ user: patient._id, role: 'patient' });

    return res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: {
            token,
            patient,
            isUsernameAdded: patient.username ? true : false,
            isUserDetailsFilled: patient.bio ? true : false,
        },
    });
};

// exports.appleLogin = async (req, res, next) => {
//     try {
//         const { idToken, fullName, fcmToken } = req.body;

//         // Step 1: Decode the idToken to get the payload
//         const payload = jwt.decode(idToken);
//         console.log(payload, "payload>>>>>>");

//         // Always use lowercase email
//         const email = payload.email?.toLowerCase();

//         let user = await findUser({
//             email: email,
//             isDeleted: false,
//         }).populate({ path: "earnedBadges", select: "name icon" });

//         if (!user) {
//             // If user doesn't exist, create one
//             const userObj = {
//                 fullName,
//                 email: email,
//                 isOtpVerified: true,
//                 fcmToken: [fcmToken],
//             };

//             user = await createUser(userObj);

//             await LoggedDeviceModel.create({
//                 user: user._id,
//                 deviceUniqueId: req.headers.deviceuniqueid,
//                 deviceModel: req.headers.devicemodel,
//                 ipAddress: req.ip || req.connection.remoteAddress,
//             });

//             const token = generateToken(user);
//             generateResponse({ user, token, signup: true }, "User Login Successfully", res);
//             return;
//         } else {
//             // If user exists, update fcmToken
//             let updatedUser = await updateUserById(user._id, {
//                 $addToSet: { fcmToken: fcmToken },
//             }).populate({ path: "earnedBadges", select: "name icon" });

//             const token = generateToken(user);
//             generateResponse({ user: updatedUser, token, signup: false }, "User Login Successfully", res);
//             return;
//         }
//     } catch (error) {
//         next(new Error(error.message));
//     }
// };

exports.addPatientDetails = async (req, res) => {
    const { firstName, lastName, dateOfBirth, bio } = req.body;
    const { _id } = req.user;

    let profilePicURL;

    if (req.file) {
        const s3 = UploadManager.getInstance();
        profilePicURL = await s3.uploadSingleImage(req.file);
        console.log('profilePicURL', profilePicURL);
    } else {
        profilePicURL = '';
    }

    // Create new patient
    await UserModel.findByIdAndUpdate(
        _id,
        {
            firstName,
            lastName,
            dateOfBirth,
            bio,
            profilePicURL,
        },
        { new: true },
    );

    return res.status(201).json({
        success: true,
        message: 'User details updated successfully',
        data: null,
    });
};

exports.updatePatientUsername = async (req, res) => {
    const { username } = req.body;
    const { _id } = req.user;

    // Check if username already exists
    const existingUser = await UserModel.findOne({
        username: username.toLowerCase(),
        role: 'patient',
    });

    if (existingUser) throw AppError.badRequest('Username already exists');

    // Update patient with new username
    const patient = await UserModel.findByIdAndUpdate(
        { _id, role: 'patient' },
        { username: username.toLowerCase(), isProfileCompleted: true },
        { new: true },
    );
    const token = generateToken({ user: patient._id, role: 'patient' });

    return res.status(200).json({
        success: true,
        message: 'Username added successfully',
        data: {
            patient,
            token,
        },
    });
};

exports.editPatientDetails = async (req, res) => {
    const { firstName, lastName, dateOfBirth, bio, username, removeProfilePic } = req.body;
    const { _id } = req.user;

    const updatePayload = {};

    if (firstName) updatePayload.firstName = firstName;
    if (lastName) updatePayload.lastName = lastName;
    if (bio) updatePayload.bio = bio;
    if (dateOfBirth) updatePayload.dateOfBirth = dateOfBirth;
    if (removeProfilePic === 'true') updatePayload.profilePicURL = '';

    // Handle optional profile pic
    if (req.file) {
        const s3 = UploadManager.getInstance();
        const profilePicURL = await s3.uploadSingleImage(req.file);
        updatePayload.profilePicURL = profilePicURL;
    }

    // Check and update username if provided
    if (username) {
        const lowerUsername = username.toLowerCase();

        const usernameExists = await UserModel.findOne({
            _id: { $ne: _id },
            username: lowerUsername,
            role: 'patient',
        });

        if (usernameExists) throw AppError.badRequest('Username already taken by another user');

        updatePayload.username = lowerUsername;
        updatePayload.isProfileCompleted = true;
    }

    const updatedPatient = await UserModel.findByIdAndUpdate({ _id, role: 'patient' }, updatePayload, { new: true });

    if (!updatedPatient) throw AppError.notFound('Patient not found');

    // Remove password if any (safety)
    const sanitizedPatient = updatedPatient.toObject();
    delete sanitizedPatient.password;

    return res.status(200).json({
        success: true,
        message: 'Patient details updated successfully',
        data: sanitizedPatient,
    });
};

// ******** DELETE ACCOUNT ********

exports.initiateDeleteAccount = async (req, res) => {
    const { email } = req.user;
    const normalizedEmail = email.toLowerCase();
    const otpCode = 11111;

    // Send OTP on email
    await OTPModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
            $set: { otp: otpCode, createdAt: new Date(), reattempts: 1 },
        },
        { upsert: true },
    );
    await sendOTPEmail(normalizedEmail, otpCode);

    res.status(200).json({
        success: true,
        message: 'OTP sent to your email for account deletion',
        data: {
            email,
        },
    });
}

exports.verifyDelete = async (req, res) => {
    const { otp } = req.body;
    const { email } = req.user;

    const normalizedEmail = email.toLowerCase();
    const otpRecord = await OTPModel.findOne({ email: normalizedEmail, otp });
    if (!otpRecord) throw AppError.badRequest('Invalid OTP');
    if (otpRecord.reattempts >= 10) {
        throw AppError.badRequest('Maximum OTP attempts exceeded');
    }
    if (otpRecord.createdAt < new Date(Date.now() - 5 * 60 * 1000)) {
        throw AppError.badRequest('OTP expired');
    }
    otpRecord.reattempts += 1;
    await otpRecord.save();
    res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
            email,
        },
    });
}

exports.deleteAccount = async (req, res) => {
    const { _id } = req.user;
    const { reactivateAt } = req.body;

    if (!reactivateAt) {
        throw AppError.badRequest('reactivateAt (ISO date string) is required');
    }

    const parsedReactivateAt = new Date(reactivateAt);
    if (isNaN(parsedReactivateAt.getTime())) {
        throw AppError.badRequest('Invalid reactivateAt date');
    }

    const now = new Date();
    const user = await UserModel.findById(_id);
    if (!user) throw AppError.notFound('User not found');
    if (user.isDeleted) throw AppError.badRequest('User account already deleted');

    user.isDeleted = true;
    user.reactivateAt = parsedReactivateAt;
    await user.save();

    res.status(200).json({
        success: true,
        message: `Account deactivated for ${parsedReactivateAt.toISOString()} hours`,
        data: {
            deactivatedAt: now,
            reactivateAt
        },
    });
}