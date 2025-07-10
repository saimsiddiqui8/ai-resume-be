const { z } = require('zod');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

exports.UserIdValidator = z.object({
    userId: z.string().regex(objectIdPattern, { message: 'Invalid userId format' }),
});

exports.CompleteUserProfileValidator = z.object({
    name: z.string().trim().min(1, { message: 'Please enter your name' }),
    password: z.string().trim().min(8, { message: 'Password must be at least 8 characters long' }),
    address: z.string().trim().min(1, { message: 'Please enter your address' }),
    apartment: z.string().trim().optional(),
    city: z.string().trim().min(1, { message: 'Please enter your city' }),
    country: z.string().trim().min(1, { message: 'Please enter your country' }),
    state: z.string().trim().min(1, { message: 'Please enter your state' }),
    phone: z.string().trim().min(1, { message: 'Please enter your phone number' }),
    zipCode: z.number({ invalid_type_error: 'Zip code must be a number' }),
    longitude: z.number({
        invalid_type_error: 'Please enter your longitude as a number',
    }),
    latitude: z.number({
        invalid_type_error: 'Please enter your latitude as a number',
    }),
});

exports.UpdateUserProfileValidator = z.object({
    name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    apartment: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    state: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    zipCode: z.number({ invalid_type_error: 'Zip code must be a number' }).optional(),
    longitude: z
        .number({ invalid_type_error: 'Please enter your longitude as a number' })
        .optional(),
    latitude: z.number({ invalid_type_error: 'Please enter your latitude as a number' }).optional(),
});

exports.UpdatePasswordValidator = z.object({
    password: z.string().trim().min(8, {
        message: 'Password must be at least 8 characters long',
    }),
});

exports.ChangePasswordValidator = z.object({
    password: z.string().trim().min(1, { message: 'Please enter your password' }),
    newPassword: z.string().trim().min(8, {
        message: 'Password must be at least 8 characters long',
    }),
});

exports.VerifyOtpValidator = z.object({
    otp: z
        .number({
            invalid_type_error: 'OTP must be a number',
            required_error: 'OTP is required',
        })
        .min(100000, { message: 'OTP must be at least 100000' })
        .max(999999, { message: 'OTP must be at most 999999' }),
});
