import mongoose from "mongoose";
const { Schema} = mongoose;

const NotificationContentSchema = new Schema(
  {
    userId: {
      type: String,
      ref: "User"
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null
    },
    title: {
      type: String,
      required: [true, "Notification title can't be empty"],
    },
    message: {
      type: String,
      required: [true, "Notification text can't be empty"],
    },
    notification_type: {
      type: String,
      default: ""
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    data: {
      goalId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
    },

  },
  {timestamps: true}
);

const NotificationContent =  mongoose.model("NotificationContent", NotificationContentSchema);

export {NotificationContent};
