const bcrypt = require('bcryptjs');
const UserModel = require('../../models/UserModel');
const AppError = require('../../utils/AppError');
const OTPModel = require('../../models/OTPModel');
const { generateToken, sendOTPEmail } = require('../../utils/Helper');
const LoggedDeviceModel = require('../../models/LoggedDeviceModel');
const UploadManager = require('../../utils/UploadManager');
const QualificationModel = require('../../models/QualificationModel');
const DoctorDocumentModel = require('../../models/DoctorDocumentModel');

exports.initiateDoctorSignUp = async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { deviceuniqueid, devicemodel } = req.headers;

    const existedUser = await UserModel.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (existedUser && (existedUser.isProfileCompleted || existedUser.isEmailVerified || existedUser.bio || existedUser.dateOfBirth)) throw AppError.badRequest('Email already exists');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    let newDoctor;
    if (!existedUser) {
        newDoctor = await UserModel.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'doctor',
        });
    } else if (!existedUser.isEmailVerified) {
        newDoctor = existedUser;
    } else {
        throw AppError.badRequest('Email already exists');
    }

    const otpCode = 11111;

    // Send OTP on email
    await OTPModel.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { otp: otpCode, createdAt: new Date() }, $inc: { reattempts: 1 } },
        { upsert: true },
    );

    await Promise.all([
        sendOTPEmail(email.toLowerCase(), otpCode),
        LoggedDeviceModel.findOneAndUpdate(
            { user: newDoctor._id },
            {
                user: newDoctor._id,
                deviceUniqueId: deviceuniqueid,
                deviceModel: devicemodel,
                ipAddress: ip,
                userAgent: userAgent,
            },
            { upsert: true },
        ),
    ]);

    const token = generateToken({ user: newDoctor._id, role: 'doctor' });
    res.status(201).json({
        success: true,
        message: 'Doctor registration initiated successfully',
        data: {
            token,
        },
    });
};

exports.verifyDoctorEmail = async (req, res) => {
    const { otp } = req.body;
    const { _id, email } = req.user;
    const normalizedEmail = email.toLowerCase();

    const otpRecord = await OTPModel.findOne({ email: normalizedEmail });

    if (otpRecord && otpRecord.reattempts >= 10)
        throw AppError.tooManyRequests('Max OTP attempts reached');
    if (!otpRecord || otpRecord.otp !== parseInt(otp, 10)) {
        await OTPModel.findOneAndUpdate({ email: normalizedEmail }, { $inc: { reattempts: 1 } });
        throw AppError.badRequest('Invalid OTP');
    }

    // Update doctor's email verification status
    const doctor = await UserModel.findOne({ _id, role: 'doctor' });
    if (!doctor) {
        throw AppError.notFound('Doctor not found');
    }

    doctor.isEmailVerified = true;
    await doctor.save();

    // Remove OTP after successful verification
    await OTPModel.deleteOne({ email: normalizedEmail });
    const token = generateToken({ user: _id, role: 'doctor' });

    return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
            token
        },
    });
};

exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.user;
    const normalizedEmail = email.toLowerCase();

    // const otpCode = Math.floor(10000 + Math.random() * 90000);
    const otpCode = 11111;
    const otpRecord = await OTPModel.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { otp: otpCode, reattempts: 1, createdAt: new Date() } },
        { upsert: true, new: true },
    );

    if (!otpRecord) {
        throw AppError.internalServerError('Failed to generate OTP');
    }

    await sendOTPEmail(normalizedEmail, otpCode);
    return res.status(200).json({
        success: true,
        message: 'Verification email resent successfully',
        data: null,
    });
};

exports.addDoctorDetails = async (req, res) => {
    const { fullName, gender, currentLocation, bio } = req.body;
    const { _id } = req.user;

    const doctor = await UserModel.findOne({ _id, role: 'doctor' });
    if (!doctor) {
        throw AppError.notFound('Doctor not found');
    }

    // Upload profile picture to S3 if provided
    let profilePicURL = doctor.profilePicURL; // Preserve existing if not updated
    if (req.file) {
        const s3 = UploadManager.getInstance();
        profilePicURL = await s3.uploadSingleImage(req.file);
    }

    // Update doctor profile
    doctor.fullName = fullName;
    doctor.gender = gender;
    doctor.bio = bio?.trim() || '';
    doctor.profilePicURL = profilePicURL || '';

    doctor.currentLocation = {
        placeName: currentLocation?.placeName || '',
        location: {
            type: 'Point',
            coordinates: currentLocation?.location?.coordinates || [0, 0],
        },
    };
    await doctor.save();

    // Prepare clean response object
    const responseDoctor = doctor.toObject();
    delete responseDoctor.password;

    return res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: responseDoctor,
    });
};

exports.updateDoctorProfile = async (req, res) => {
    req.body.qualifications = JSON.parse(req.body?.qualifications || '{}');
    req.body.document = JSON.parse(req.body?.document || '{}');
    req.body.currentLocation = JSON.parse(req.body?.currentLocation || '{}');

    const { _id } = req.user;

    const {
        fullName,
        gender,
        bio,
        removeProfilePic,
        currentLocation,
        qualifications,
        document: frontendDocs = [],
    } = req.body;

    const user = await UserModel.findOne({ _id, role: 'doctor' });
    if (!user) return next(AppError.notFound('Doctor not found'));

    // Split and update full name
    if (fullName) {
        const [firstName, ...lastName] = fullName.trim().split(' ');
        user.firstName = firstName || '';
        user.lastName = lastName.join(' ') || '';
    }

    user.gender = gender || user.gender;
    user.bio = bio?.trim() || '';
    user.currentLocation = {
        placeName: currentLocation?.placeName || '',
        location: {
            type: 'Point',
            coordinates: currentLocation?.location?.coordinates || [0, 0],
        },
    };

    // Upload profile image if provided
    if (req.files?.profilePic?.[0]) {
        const s3 = UploadManager.getInstance();
        const profilePicURL = await s3.uploadSingleImage(req.files.profilePic[0]);
        user.profilePicURL = profilePicURL;
    } else if (removeProfilePic === "true") {
        user.profilePicURL = "";
    } else {
        user.profilePicURL = user.profilePicURL;
    }

    await user.save();

    // Update qualifications
    if (Array.isArray(qualifications)) {
        await QualificationModel.deleteMany({ user: _id });

        const formatted = qualifications.map(q => ({
            user: _id,
            certification: q.certification,
            institution: q.institution,
            completionDate: new Date(q.completionDate),
        }));

        await QualificationModel.insertMany(formatted);
    }

    const existingDocs = await DoctorDocumentModel.find({ user: _id });

    const frontendDocIds = frontendDocs.map(doc => doc._id).filter(Boolean);

    const toDelete = existingDocs.filter(doc => !frontendDocIds.includes(doc._id.toString()));
    const toDeleteIds = toDelete.map(doc => doc._id);

    if (toDeleteIds.length) {
        const s3 = UploadManager.getInstance();

        // First, delete files from S3
        await Promise.all(
            toDelete.map(async (doc) => {
                try {
                    await s3.deleteFileFromBucket(doc.fileUrl);
                } catch (err) {
                    console.error(`Failed to delete from S3: ${doc.fileUrl}`, err);
                }
            })
        );

        // Then, remove from DB
        await DoctorDocumentModel.deleteMany({ _id: { $in: toDeleteIds } });
    }

    if (req.files?.documents?.length > 0) {
        const s3 = UploadManager.getInstance();

        const uploads = await Promise.all(
            req.files.documents.map(async (file) => {
                const fileUrl = await s3.uploadSingleImage(file);
                return {
                    user: _id,
                    fileName: file.originalname,
                    fileUrl,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                };
            })
        );

        await DoctorDocumentModel.insertMany(uploads);
    }

    return res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        data: {
            ...user.toObject(),
            isDetailsAdded: !!user.bio,
            isQualificationAdded: qualifications && qualifications.length > 0,
            qualifications: await QualificationModel.find({ user: _id }),
            documents: await DoctorDocumentModel.find({ user: _id }),
        },
    });
};


exports.login = async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { deviceuniqueid, devicemodel } = req.headers;

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const doctor = await UserModel.findOne({ email: normalizedEmail, isEmailVerified: true, isDeleted: false, role: 'doctor' });
    if (!doctor) throw AppError.notFound('Doctor not found');

    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) throw AppError.unauthorized('Invalid password');

    const token = generateToken({ user: doctor._id, role: 'doctor' });

    const [_, qualifications, documents] = await Promise.all([
        await LoggedDeviceModel.findOneAndUpdate(
            { user: doctor._id },
            {
                user: doctor._id,
                deviceUniqueId: deviceuniqueid,
                deviceModel: devicemodel,
                ipAddress: ip,
                userAgent: userAgent,
            },
            { upsert: true },
        ),
        QualificationModel.find({ user: doctor._id }),
        DoctorDocumentModel.find({ user: doctor._id }),
    ]);

    // Prepare clean response object
    const responseDoctor = doctor.toObject();

    responseDoctor.qualifications = qualifications || [];
    responseDoctor.documents = documents || [];
    responseDoctor.isDetailsAdded = responseDoctor.bio ? true : false;
    responseDoctor.isQualificationAdded = qualifications.length > 0;
    responseDoctor.isDocumentAdded = documents.length > 0;

    delete responseDoctor.password;

    return res.status(200).json({
        success: true,
        message: 'Doctor logged in successfully',
        data: {
            token,
            user: responseDoctor
        },
    });
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const doctor = await UserModel.findOne({ email: normalizedEmail, isDeleted: false, role: 'doctor' });
    if (!doctor) {
        throw AppError.notFound('Doctor not found');
    }

    // Check if OTP already exists for this email
    const existing = await OTPModel.findOne({ email: normalizedEmail });
    if (existing && existing.reattempts >= 10) {
        throw AppError.tooManyRequests('Max OTP attempts reached');
    }

    // const otpCode = Math.floor(10000 + Math.random() * 90000);
    const otpCode = 11111;
    // Send OTP on email
    await OTPModel.findOneAndUpdate(
        { email: normalizedEmail },
        {
            $set: { otp: otpCode, createdAt: new Date() },
            $inc: { reattempts: 1 },
        },
        { upsert: true },
    );
    await sendOTPEmail(normalizedEmail, otpCode);
    return res.status(200).json({
        success: true,
        message: 'OTP sent to your email',
        data: null,
    });
};

exports.verifyForgotPasswordOTP = async (req, res) => {
    const { otp, email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const otpRecord = await OTPModel.findOne({ email: normalizedEmail });
    if (otpRecord && otpRecord.reattempts >= 10)
        throw AppError.tooManyRequests('Max OTP attempts reached');
    if (!otpRecord || otpRecord.otp !== parseInt(otp, 10)) {
        await OTPModel.findOneAndUpdate({ email: normalizedEmail }, { $inc: { reattempts: 1 } });
        throw AppError.badRequest('Invalid OTP');
    }

    await OTPModel.deleteOne({ email: normalizedEmail });

    return res.status(200).json({
        success: true,
        message: 'OTP verified successfully.',
        data: null,
    });
};

exports.resendForgotPasswordOTP = async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    // const otpCode = Math.floor(10000 + Math.random() * 90000);
    const otpCode = 11111;
    const otpRecord = await OTPModel.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { otp: otpCode, reattempts: 1, createdAt: new Date() } },
        { upsert: true, new: true },
    );

    if (!otpRecord) {
        throw AppError.internalServerError('Failed to generate OTP');
    }

    await sendOTPEmail(normalizedEmail, otpCode);
    return res.status(200).json({
        success: true,
        message: 'Verification email resent successfully',
        data: null,
    });
}

exports.createNewPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase();

    const doctor = await UserModel.findOne({ email: normalizedEmail, isDeleted: false, role: 'doctor' });
    if (!doctor) {
        throw AppError.notFound('Doctor not found');
    }

    doctor.password = await bcrypt.hash(newPassword, 10);
    await doctor.save();

    return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: null,
    });
};

//**************** QUALIFICATIONS *****************

exports.addQualifications = async (req, res) => {
    const { qualifications } = req.body;
    const { _id } = req.user;

    const formattedQualifications = qualifications.map((q) => ({
        user: _id,
        certification: q.certification,
        institution: q.institution,
        completionDate: new Date(q.completionDate),
    }));

    const qualification = await QualificationModel.insertMany(formattedQualifications);

    return res.status(200).json({
        success: true,
        message: 'Qualifications added successfully',
        data: qualification,
    });
};

exports.getAllQualifications = async (req, res) => {
    const { _id } = req.user;
    const qualifications = await QualificationModel.find({ role: "doctor", user: _id }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: 'All Qualifications retrieved successfully',
        data: qualifications,
    });
};

exports.editQualification = async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    const { certification, institution, completionDate } = req.body;

    const qualification = await QualificationModel.findOne({ _id: id, user: _id });

    if (!qualification) throw AppError.notFound('Qualification not found');

    qualification.certification = certification;
    qualification.institution = institution;
    qualification.completionDate = new Date(completionDate);

    await qualification.save();

    return res.status(200).json({
        success: true,
        message: 'Qualification updated successfully',
        data: qualification,
    });
};

exports.deleteQualification = async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;

    const qualification = await QualificationModel.findOneAndDelete({ _id: id, user: _id });

    if (!qualification) {
        return res.status(404).json({ success: false, message: 'Qualification not found' });
    }

    return res.status(200).json({
        success: true,
        message: 'Qualification deleted successfully',
        data: null,
    });
};

//**************** DOCUMENTS *****************

exports.uploadDocument = async (req, res) => {
    const { _id } = req.user;
    const files = req.files; // Expecting an array of files

    if (!files || files.length === 0) throw AppError.badRequest('No files uploaded');
    const s3 = UploadManager.getInstance();

    // Upload all files and create document entries
    const documents = [];
    const [user, qualifications] = await Promise.all([
        UserModel.findById(_id),
        QualificationModel.find({ user: _id }).sort({ createdAt: -1 }),
        Promise.all(files.map(async (file) => {
            const URL = await s3.uploadSingleImage(file);
            if (!URL) throw AppError.internalServerError('Failed to upload document to bucket');
            const doc = await DoctorDocumentModel.create({
                user: _id,
                fileName: file.originalname,
                fileUrl: URL,
                fileSize: file.size,
                mimeType: file.mimetype,
            });
            documents.push(doc);
        }))
    ]);

    user.isProfileCompleted = true;
    await user.save();

    const resUser = user.toObject();
    resUser.qualifications = qualifications;
    resUser.documents = documents;
    resUser.isDetailsAdded = resUser.bio ? true : false;
    resUser.isQualificationAdded = qualifications.length > 0;
    resUser.isDocumentAdded = documents.length > 0;

    return res.status(201).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: resUser
    });
};

exports.getAllDocuments = async (req, res) => {
    const { _id } = req.user;

    const documents = await DoctorDocumentModel.find({ user: _id }).sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        message: 'All documents retrieved successfully',
        data: documents,
    });
};

exports.deleteDocument = async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;

    const deletedDoument = await DoctorDocumentModel.findOneAndDelete({ _id: id, user: _id });
    if (!deletedDoument) throw AppError.notFound('Document not found');

    const s3 = UploadManager.getInstance();
    const deletedFromBucket = await s3.deleteFileFromBucket(deletedDoument.fileUrl);

    if (!deletedFromBucket) {
        throw AppError.database('Failed to delete document from bucket');
    }

    return res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: null,
    });
};
