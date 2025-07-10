const { z } = require('zod');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

exports.CreateNotificationValidator = z.object({
    title: z.string().trim().min(1, { message: 'Please enter Title' }),
    description: z.string().trim().min(1, { message: 'Please enter Description' }),
});

exports.SendNotificationValidator = z.object({
    user: z.object(
        {
            _id: z.string().regex(objectIdPattern, { message: 'Invalid _id format' }),
            uid: z.string().trim().min(1, { message: 'Please enter Uid' }),
            name: z.string().trim().min(1, { message: 'Please enter name' }),
            email: z
                .string()
                .trim()
                .email({ message: 'Please enter email' })
                .optional()
                .or(z.literal(''))
                .nullable(),
            profilePicture: z.string().trim().optional().or(z.literal('')).nullable(),
        },
        { required_error: 'User object is required' },
    ),
    title: z.string().trim().min(1, { message: 'Please enter Title' }),
    description: z.string().trim().min(1, { message: 'Please enter Description' }),
    chatId: z.string().trim().min(1, { message: 'Please enter Chat ID' }),
});

exports.ReadNotificationValidator = z.object({
    notificationId: z.string().regex(objectIdPattern, { message: 'Invalid notificationId format' }),
});

exports.DeleteNotificationValidator = z.object({
    notificationId: z.string().regex(objectIdPattern, { message: 'Invalid notificationId format' }),
});
