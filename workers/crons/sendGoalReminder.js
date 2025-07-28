import moment from "moment";
import Goal from "../../models/Goal/goal.model.js";
import Notification from "../../models/notifications/notification.model.js";
import sendNotification from "../../utils/notification/send-notification.js";
import { NotificationContent } from "../../models/notifications/notification-content.model.js";


const sendGoalReminder = async () => {
  try {
    const now = new Date();
    

    const rangeStart = moment(now).add(24, 'hours').startOf('minute').toDate();
    const rangeEnd = moment(now).add(24, 'hours').endOf('minute').toDate();

    const upcomingGoals = await Goal.find({
      status: { $ne: "Completed" },
      deadline: { $gte: rangeStart, $lte: rangeEnd }
    });
    console.log("upcomingGoals====", upcomingGoals);
    if (upcomingGoals.length === 0) return; 
    
    for (const goal of upcomingGoals) {
      // Fetch all device tokens for the user
      const userNotification = await Notification.findOne({ userId: goal.userId });
      const registrationTokens = userNotification?.devices.map(device => device.fcmToken) || [];
      // Notification Message
      const title = "Goal Deadline Alert ⏳";
      const message = `Hurry up! Your goal is about to reach its deadline on ${moment(goal.deadline).format("MMMM Do YYYY, h:mm A")}. Keep pushing! 💪`;

      // Send notification if the user has registered devices
      if (registrationTokens.length > 0) {
        await sendNotification(registrationTokens, title, message);
        console.log("Goal reminders sent successfully.");
      }
      // Save the reminder in the NotificationContent collection with goalId in data
      await NotificationContent.create({
        userId: goal.userId,
        title,
        message,
        notification_type: "alert",
        data: { goalId: goal._id },
      });
    }

  } catch (error) {
    console.error("Error sending goal reminders:", error);
  }
};

export {sendGoalReminder};
