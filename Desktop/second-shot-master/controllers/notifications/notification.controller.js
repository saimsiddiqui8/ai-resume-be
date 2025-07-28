import { NotificationContent } from "../../models/notifications/notification-content.model.js";
import Notification from "../../models/notifications/notification.model.js";
import { deleteNotificationSchema } from "../../validators/notification-validations.js";


const myNotifications = async (req, res) => {
    try {
      const userId = req.user.id;
      const notifications = await NotificationContent.find({ userId }).select('-admin_id -updatedAt').sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, data : notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };


  const markNotificationsAsRead = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Update all notifications to `is_read: true`
      await NotificationContent.updateMany({ userId, is_read: false }, { $set: { is_read: true } });
  
      return res.status(200).json({
        success: true,
        message: "All Notifications and marked as read",
      });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  const deleteNotification = async (req, res) => {
    try {
      const userId = req.user.id;
      const { notificationId } = req.body;
  
      // Validate request parameters
      const { error } = deleteNotificationSchema.validate({ notificationId });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      // Find the notification
      const notification = await NotificationContent.findById(notificationId);
  
      if (!notification) {
        return res.status(400).json({
          success: false,
          message: "Notification not found!",
        });
      }
  
      // Ensure the notification belongs to the authenticated user
      if (notification.userId.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Unauthorized: You can only delete your own notifications",
        });
      }
  
      // Delete the notification
      await NotificationContent.findByIdAndDelete(notificationId);
  
      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
  const toggleNotification = async (req, res) => {
    try {
      const userId  = req.user.id;
  
      // Find notification record
      const notification = await Notification.findOne({ userId });
  
      if (!notification) {
        return res.status(400).json({
          success: false,
          message: "Notification settings not found",
        });
      }
  
      // Toggle notification_enabled
      notification.notification_enabled = !notification.notification_enabled;
  
      // Save the updated document
      await notification.save();
  
      return res.status(200).json({
        success: true,
        message: `Notification setting updated!`,
        data: { notification_enabled: notification.notification_enabled },
      });
  
    } catch (error) {
      console.error("Error toggling notification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const myNotificationSetting = async (req, res) => {
    try {
      const  userId  = req.user.id;
  
      const notification = await Notification.findOne({ userId }).select('notification_enabled -_id').lean();
  
      if (!notification) {
        return res.status(400).json({
          success: false,
          message: "No notifications found for this user",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: notification,
      });
  
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  export {myNotifications, markNotificationsAsRead, deleteNotification, toggleNotification, myNotificationSetting}