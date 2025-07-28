const pkg = require('mongoose');
const { Schema, model, models } = pkg;

const OTPSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: Number,
            required: true,
            length: 5,
        },
        reattempts: {
            type: Number,
            default: 1,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 300, // TTL: 300 seconds = 5 minutes
        },
    },
    { timestamps: false },
);

const OTPModel = models.OTP || model('OTP', OTPSchema);

module.exports = OTPModel;
