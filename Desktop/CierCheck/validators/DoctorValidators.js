const { z } = require('zod');

const DoctorSignUpValidator = z.object({
    firstName: z.string().min(1).max(50).trim(),
    lastName: z.string().min(1).max(50).trim(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).trim(),
    email: z.string().email().max(100).trim(),
    password: z.string().min(6).max(100),
    phone: z.string().min(7).max(20).trim(),
    profilePicURL: z.string().url().optional(),
    bio: z.string().max(500).optional(),
});

module.exports = {
    DoctorSignUpValidator,
}; 