import Joi from "joi";

const deleteNotificationSchema = Joi.object({
    notificationId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
      "string.empty": "Notification ID is required",
      "string.pattern.base": "Invalid Notification ID format",
    }),
  });

  export {deleteNotificationSchema}