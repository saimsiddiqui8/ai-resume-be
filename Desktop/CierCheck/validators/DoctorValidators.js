const { z } = require('zod');

exports.InitiateDoctorSignUpValidator = z.object({
    email: z.string().email().max(100).trim().toLowerCase(),
    password: z.string().min(6).max(100),
});

exports.VerifyDoctorSignUpValidator = z.object({
    otp: z.string().length(5, 'OTP must be exactly 5 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

exports.LoginValidator = z.object({
    password: z.string().min(6).max(100),
    email: z.string().email().max(100).trim().toLowerCase(),
});

exports.ForgotPasswordValidator = z.object({
    email: z.string().email().max(100).trim().toLowerCase(),
});

exports.VerifyForgotPasswordValidator = z.object({
    otp: z.string().length(5, 'OTP must be exactly 5 digits').regex(/^\d+$/, 'OTP must be numeric'),
    email: z.string().email().max(100).trim().toLowerCase(),
});

exports.CreateNewPasswordValidator = z.object({
    newPassword: z.string().min(6).max(100),
    email: z.string().email().max(100).trim().toLowerCase(),
});

exports.DoctorAddDetailsValidator = z.object({
    fullName: z.string().min(1).max(50).trim(),
    // profilePicURL: z.string().url().optional(),
    gender: z.enum(['male', 'female'], {
        required_error: 'Gender is required',
        invalid_type_error: 'Gender must be either male or female',
    }),
    currentLocation: z.object({
        placeName: z.string().max(200).trim(),
        location: z.object({
            type: z.literal('Point').default('Point'),
            coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
        }),
    }),
    bio: z.string().max(500).optional(),
});

exports.QualificationValidator = z.object({
    qualifications: z.array(
        z.object({
            certification: z
                .string({ required_error: 'Certification is required' })
                .min(1, 'Certification cannot be empty'),
            institution: z
                .string({ required_error: 'Institution is required' })
                .min(1, 'Institution cannot be empty'),
            completionDate: z
                .string({ required_error: 'Completion date is required' })
                .refine((date) => !isNaN(Date.parse(date)), {
                    message: 'Invalid completion date format',
                }),
        })
    ).min(1, 'At least one qualification is required'),
});
