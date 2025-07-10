const pkg = require('mongoose');
const { Schema, model, models } = pkg;

const OTPSchema = new Schema(
    {
        signUpRecord: {
            type: Schema.Types.ObjectId,
            ref: 'SignUp',
            required: true,
        },
        otp: {
            type: Number,
            require: true,
        },
        type: {
            type: String,
            enum: {
                values: ['email', 'phone'],
            },
        },
    },
    { timestamps: true },
);

const OTPModel = models.OTP || model('OTP', OTPSchema);

module.exports = OTPModel;
