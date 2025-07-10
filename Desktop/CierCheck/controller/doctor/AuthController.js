const bcrypt = require('bcryptjs');
const DoctorModel = require('../../models/DoctorModel');
const AppError = require('../../utils/AppError');
const catchAsync = require('../../utils/catchAsync');

/**
 * Doctor Signup Controller
 * Expects: { firstName, lastName, username, email, password, phone, specialty }
 */
const doctorSignUp = async (req, res) => {
    const { firstName, lastName, username, email, password, phone, specialty } = req.body;

    // Check for existing email or username
    const existingDoctor = await DoctorModel.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingDoctor) {
        throw AppError.badRequest('Email or username already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = await DoctorModel.create({
        firstName,
        lastName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        specialty,
    });

    // Remove password from response
    const doctorObj = doctor.toObject();
    delete doctorObj.password;

    return res.status(201).json({
        success: true,
        message: 'Doctor registered successfully',
        doctor: doctorObj,
    });
};

module.exports = {
    doctorSignUp,
};
