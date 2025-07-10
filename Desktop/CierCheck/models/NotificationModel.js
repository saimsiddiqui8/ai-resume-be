const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const NotificationSchema = new Schema({
    recipientType: { type: String, enum: ['patient', 'doctor'], required: true },
    recipient: { type: Types.ObjectId, required: true, refPath: 'recipientType' },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const NotificationModel = models.Notification || model('Notification', NotificationSchema);
module.exports = NotificationModel;
