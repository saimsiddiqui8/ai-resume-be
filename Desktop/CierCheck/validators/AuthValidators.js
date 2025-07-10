const { z } = require('zod');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

exports.EmailSignUpValidator = z.object({
    firstName: z.string().min(1).max(50).trim(),
    fcmToken: z.string(),
    lastName: z.string().min(1).max(50).trim(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).trim(),
    email: z.string().email().max(100).trim(),
    password: z.string().min(6).max(100),
    phone: z.string().min(7).max(20).trim(),
    profilePicURL: z.string().url().optional(),
    bio: z.string().max(500).optional(),
});

exports.InitiateEmailSignUpValidator = z.object({
    email: z.string().trim().email({ message: 'Please enter a valid Email address' }),
    password: z.string().trim().min(8, { message: 'Password must be at least 8 characters long' }),
});

exports.StoreEmailSignUpValidator = z.object({
    email: z.string().trim().email({ message: 'Please enter a valid Email address' }),
    password: z.string().trim().min(8, { message: 'Password must be at least 8 characters long' }),
    idToken: z.string().optional(),
    role: z.literal('store', {
        errorMap: () => ({ message: 'Invalid role provided' }),
    }),
    name: z.string().trim().min(1, { message: 'Please enter your name' }),
    phone: z.string().trim().min(1, { message: 'Please enter your phone number' }),
});

exports.EmailSignInValidator = z.object({
    email: z.string().trim().email({ message: 'Please enter a valid Email address' }),
    password: z.string().trim().min(8, { message: 'Password must be at least 8 characters long' })
});

exports.CheckEmailValidator = z.object({
    email: z.string().trim().email({ message: 'Please enter a valid Email address' }),
    role: z.enum(['user', 'store'], {
        errorMap: () => ({ message: 'Invalid role provided' }),
    }),
});

exports.SocialRegisterValidator = z.object({
    idToken: z.string().min(1, { message: 'Please provide an ID token' }),
    role: z.literal('user', {
        errorMap: () => ({ message: 'Invalid role provided' }),
    }),
});

exports.OtpValidator = z.object({
    email: z.string().email({ message: 'Please enter a valid Email address' }),
    role: z.string().min(1, { message: 'Please enter role' }),
    otp: z
        .number()
        .max(999999, { message: 'OTP must be at most 999999' })
        .min(0, { message: 'OTP must be a number' }), // Ensures it's a number and not negative
});

exports.ResendOtpValidator = z.object({
    email: z.string().email({ message: 'Please enter a valid Email address' }),
    role: z.string().trim().min(1, { message: 'Please enter your Role' }),
});

exports.ForgotPasswordValidator = z.object({
    email: z.string().email({ message: 'Please enter a valid Email address' }),
    role: z.string().trim().min(1, { message: 'Please enter your Role' }),
});

exports.EmailVerifyValidator = z.object({
    email: z.string().email({ message: 'Please enter a valid Email address' }),
    role: z.string().min(1, { message: 'Please enter role' }),
    otp: z
        .number()
        .min(100000, { message: 'OTP must be at least 100000' })
        .max(999999, { message: 'OTP must be at most 999999' }),
});

exports.UserIdValidtor = z
    .object({
        userId: z.string().regex(objectIdPattern, {
            message: 'userId must be a valid ObjectId',
        }),
    })
    .passthrough(); // equivalent of `.unknown(true)`

exports.UpdateFCMValidator = z.object({
    fcmToken: z.string().trim().min(1, { message: 'Please enter fcm token' }),
});

exports.DeleteAccountValidator = z.object({
    password: z.string().trim().min(1, { message: 'Please enter password' }),
});
