import moment from "moment";
import Notification from "../../models/notifications/notification.model.js";
import Goal from "../../models/Goal/goal.model.js";
import sendNotification from "../../utils/notification/send-notification.js";


const sendMissedDeadlineNotification = async () => {
  try {
    const now = moment();

    // Calculate the time window (past 1 minute only)
    const deadlineStart = moment(now).subtract(1, "minute").toDate();
    const deadlineEnd = now.toDate();

    console.log(`Checking for missed goals between: ${deadlineStart} \nand ${deadlineEnd}`);
   // Find all goals that are NOT completed and JUST missed the deadline in the last minute
    const missedGoals = await Goal.find({
      status: { $ne: "Completed" },
      deadline: { $gte: deadlineStart, $lt: deadlineEnd }, // Just passed within the last minute
    });

    for (const goal of missedGoals) {
      // Fetch all device tokens for the user
      const userNotification = await Notification.findOne({ userId: goal.userId });
      const registrationTokens = userNotification?.devices.map(device => device.fcmToken) || [];

      // Format deadline for user-friendly display
      const formattedDeadline = moment(goal.deadline).format("MMMM Do, YYYY");

      // Send notification if the user has registered devices
      if (registrationTokens.length > 0) {
        await sendNotification(
          registrationTokens,
          "Goal Not Reached!",
          `You did not reach your goal which had its deadline on ${formattedDeadline}.`
        );
      }
    }

    console.log("Missed goal deadline notifications sent successfully.");
  } catch (error) {
    console.error("Error sending missed goal deadline notifications:", error);
  }
};

export {sendMissedDeadlineNotification};
