import express from "express";
import { Router } from "express";
import rateLimit from '../middlewares/rate-limit.js'
import { adminsignUp, forgetPassword, login, resendOtpEmail, resetPassword, verifyOTP } from "../controllers/auth/admin/admin-auth.controller.js";

const router = Router();

// onboarding
router.post('/sign-up', adminsignUp);
router.post('/login', login);
router.post('/forget-password', rateLimit, forgetPassword);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOtpEmail);
router.post('/reset-password', resetPassword);



export { router };