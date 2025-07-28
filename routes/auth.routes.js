import express from "express";
import { Router } from "express";
import { checkFirebaseUser, forgetPassword, login, registerPhonewithEmail, resendOtpEmail, resendOtpPhone, resetPassword, socialLogin, usersignUp, verifyOTP, verifyOTPPhone, verifyRegisteredOtp } from "../controllers/auth/account/auth.controller.js";
import rateLimit from '../middlewares/rate-limit.js'

const router = Router();

// onboarding
router.post('/sign-up', usersignUp);
router.post('/check-firebase-user', checkFirebaseUser);
router.post('/verify-otp', verifyOTP);
router.post('/verify-otp-phone', verifyOTPPhone);
router.post('/resend-email-otp', resendOtpEmail);
router.post('/resend-phone-otp', resendOtpPhone);
router.post('/forget-password', rateLimit, forgetPassword);
router.post('/reset-password', resetPassword);

//social sign in phone verification
router.post('/register-phone', registerPhonewithEmail);
router.post('/verify-phone', verifyRegisteredOtp);

// Login
router.post('/login', login);

// Social Login
router.post('/social-login', socialLogin);





export { router };