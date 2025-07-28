const { z } = require('zod');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

exports.addPatientDetailsValidate = z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    dateOfBirth: z.coerce.date({
        required_error: 'Date of birth is required',
        invalid_type_error: 'Invalid date format',
    }),
    // username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).trim(),
    // email: z.string().email().max(100).trim(),
    bio: z.string().max(500).optional(),
});

exports.socialAuthValidate = z.object({
    idToken: z.string(),
    type: z.enum(['google', 'apple'], {
        errorMap: () => ({ message: 'Invalid social auth type' }),
    }),
});

exports.patientUsernameValidate = z.object({
    username: z.string(),
});

exports.editPatientDetailsValidate = z.object({
    firstName: z.string().min(1).max(50).trim().optional(),
    lastName: z.string().min(1).max(50).trim().optional(),
    bio: z.string().max(500).optional(),
    removeProfilePic: z.string(),
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/)
        .trim()
        .optional(),
    dateOfBirth: z.string().optional(), // You can use .refine() to validate format if needed
});

exports.DeleteAccountOtpValidator = z.object({
    otp: z.string().length(5, 'OTP must be exactly 5 digits').regex(/^\d+$/, 'OTP must be numeric'),
});