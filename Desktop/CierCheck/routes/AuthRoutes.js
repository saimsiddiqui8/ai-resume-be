const express = require('express');
const router = express.Router();
const {
    emailSignIn,
    emailSignUp,
    // socialRegister,
    // updatePassword,
    // changePassword,
    // verifyOTP,
    // forgotPassword,
    // logout,
    // updateFCMToken,
    // deleteAccount,
    // sendEmailVerificationOTP,
    // verifyEmail,
    // sendPhoneVerificationOTP,
    // verifyPhone,
    // checkEmail,
} = require('../controller/patient/AuthController');

const ProtectRouteMiddleware = require('../middlewares/ProtectRouteMiddleware');
const { createMulter } = require('../utils/Helper');
const catchAsync = require('../utils/catchAsync');
const { EmailSignUpValidator } = require('../validators/AuthValidators');
const validate = require('../middlewares/Validate');
const upload = createMulter('./uploads/pictures/');


router.post('/signUp', validate(EmailSignUpValidator), catchAsync(patientSignUp));





module.exports = router;
