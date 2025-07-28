const express = require('express');
const router = express.Router();
const validate = require('../middlewares/Validate');
const DeviceMiddleware = require('../middlewares/DeviceMiddleware');
const catchAsync = require('../utils/CatchAsync');
const {
    InitiateDoctorSignUpValidator,
    VerifyDoctorSignUpValidator,
    DoctorAddDetailsValidator,
    QualificationValidator,
    ForgotPasswordValidator,
    VerifyForgotPasswordValidator,
    CreateNewPasswordValidator,
    LoginValidator,
} = require('../validators/DoctorValidators');
const ProtectRouteMiddleware = require('../middlewares/ProtectRouteMiddleware');
const upload = require('../middlewares/Upload');
const {
    initiateDoctorSignUp,
    verifyDoctorEmail,
    addDoctorDetails,
    updateDoctorProfile,
    getAllQualifications,
    deleteQualification,
    editQualification,
    addQualifications,
    uploadDocument,
    getAllDocuments,
    deleteDocument,
    resendVerificationEmail,
    forgotPassword,
    resendForgotPasswordOTP,
    verifyForgotPasswordOTP,
    createNewPassword,
    login,
} = require('../controller/doctor/AuthController');

router.post(
    '/initiate-signup',
    DeviceMiddleware,
    validate(InitiateDoctorSignUpValidator),
    catchAsync(initiateDoctorSignUp),
);
router.post(
    '/verify-signup',
    ProtectRouteMiddleware,
    validate(VerifyDoctorSignUpValidator),
    catchAsync(verifyDoctorEmail),
);
router.post('/resend-verify-signup', ProtectRouteMiddleware, catchAsync(resendVerificationEmail));
router.post(
    '/add-details',
    ProtectRouteMiddleware,
    upload.single('profilePic'),
    validate(DoctorAddDetailsValidator),
    catchAsync(addDoctorDetails),
);
router.post(
    '/update-details',
    ProtectRouteMiddleware,
    upload.fields([
        { name: 'profilePic', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
    ]),
    catchAsync(updateDoctorProfile),
);
router.post('/login', DeviceMiddleware, validate(LoginValidator), catchAsync(login));
router.post('/forgot-password', validate(ForgotPasswordValidator), catchAsync(forgotPassword));
router.post('/resend-forgot-password', validate(ForgotPasswordValidator), catchAsync(resendForgotPasswordOTP));
router.post(
    '/veify-forgot-password',
    validate(VerifyForgotPasswordValidator),
    catchAsync(verifyForgotPasswordOTP),
);
router.post(
    '/create-new-password',
    validate(CreateNewPasswordValidator),
    catchAsync(createNewPassword),
);

// ***************** QUALIFICATIONS *****************
router.get('/get-all-qualification', ProtectRouteMiddleware, catchAsync(getAllQualifications));
router.post(
    '/add-qualification',
    ProtectRouteMiddleware,
    validate(QualificationValidator),
    catchAsync(addQualifications),
);
router.post(
    '/edit-qualification/:id',
    ProtectRouteMiddleware,
    validate(QualificationValidator),
    catchAsync(editQualification),
);
router.delete('/delete-qualification/:id', ProtectRouteMiddleware, catchAsync(deleteQualification));

// ***************** DOCUMENTS *****************
router.post(
    '/upload-document',
    ProtectRouteMiddleware,
    upload.array('file'),
    catchAsync(uploadDocument),
);
router.get('/get-all-documents', ProtectRouteMiddleware, catchAsync(getAllDocuments));
router.delete('/delete-document/:id', ProtectRouteMiddleware, catchAsync(deleteDocument));

module.exports = router;
