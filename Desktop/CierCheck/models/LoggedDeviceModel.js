const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const LoggedDeviceSchema = new Schema(
    {
        patient: {
            type: Types.ObjectId,
            ref: 'Patient',
            required: false,
        },
        doctor: {
            type: Types.ObjectId,
            ref: 'Doctor',
            required: false,
        },
        fcmToken: {
            type: String,
            default: null,
        },
        deviceIdentity: {
            type: String,
        },
        deviceModel: {
            type: String,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

const LoggedDeviceModel = models.LoggedDevice || model('LoggedDevice', LoggedDeviceSchema);

module.exports = LoggedDeviceModel;
