const express = require('express');
const router = express.Router();
const upload = require('../middlewares/Upload');
const ProtectRouteMiddleware = require('../middlewares/ProtectRouteMiddleware');
const catchAsync = require('../utils/CatchAsync');
const validate = require('../middlewares/Validate');
const DeviceMiddleware = require('../middlewares/DeviceMiddleware');
const {
    socialAuth,
    addPatientDetails,
    updatePatientUsername,
    editPatientDetails,
    initiateDeleteAccount,
    deleteAccount,
    verifyDelete,
} = require('../controller/patient/AuthController');
const {
    socialAuthValidate,
    addPatientDetailsValidate,
    patientUsernameValidate,
    editPatientDetailsValidate,
    DeleteAccountOtpValidator,
} = require('../validators/AuthValidators');

router.post('/social-auth', DeviceMiddleware, validate(socialAuthValidate), catchAsync(socialAuth));
router.post(
    '/add-details',
    ProtectRouteMiddleware,
    upload.single('profilePic'),
    validate(addPatientDetailsValidate),
    catchAsync(addPatientDetails),
);
router.post(
    '/add-username',
    ProtectRouteMiddleware,
    validate(patientUsernameValidate),
    catchAsync(updatePatientUsername),
);
router.post(
    '/edit-details',
    ProtectRouteMiddleware,
    upload.single('profilePic'),
    validate(editPatientDetailsValidate),
    catchAsync(editPatientDetails),
);
router.post('/initiate-delete', ProtectRouteMiddleware, catchAsync(initiateDeleteAccount));
router.post('/verify-delete', ProtectRouteMiddleware, validate(DeleteAccountOtpValidator), catchAsync(verifyDelete));
router.post('/delete-account', ProtectRouteMiddleware, catchAsync(deleteAccount));

module.exports = router;
