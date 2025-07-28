const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const LoggedDeviceSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: 'User',
            required: false,
        },
        deviceUniqueId: {
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
