const express = require('express');
const router = express.Router();
const { DoctorSignUpValidator } = require('../validators/DoctorValidators');
const validate = require('../middlewares/Validate');
const { doctorSignUp } = require('../controller/doctor/AuthController');

router.post('/signup', validate(DoctorSignUpValidator), catchAsync(doctorSignUp));

module.exports = router; 