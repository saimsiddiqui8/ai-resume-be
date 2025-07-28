import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: String,
      ref: "User"
    },
    devices: [
      {
        _id: false, 
        deviceId: { type: String, required: true }, // Unique ID for each device
        fcmToken: { type: String, required: true }  // Corresponding FCM token
      }
    ],
    user_type: {
      type: String,
      default: ""
    },
    notification_enabled: {
      type: Boolean,
      default: true
    },
    chat_enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
