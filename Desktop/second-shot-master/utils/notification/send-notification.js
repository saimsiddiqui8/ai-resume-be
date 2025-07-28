import { admin } from "../../configs/admin-authorizer.js";


async function sendNotification(registrationTokens, title, body, data) {
  if (!registrationTokens || registrationTokens.length === 0) return;

  const message = {
    tokens: registrationTokens,
    notification: {
      title: title || "Second Shot",
      body: body || "",
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    data: data || {}, // Add additional data payload if provided
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    const { successCount, failureCount, responses } = response;

    console.log(`Successfully sent ${successCount} messages.`);
    console.error(`Failed to send ${failureCount} messages.`);
    

    responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`Failed to send message to ${registrationTokens[idx]}: ${resp.error}`);
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

export default sendNotification;
