import Joi from "joi";

const chatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(500).required().messages({
    "string.empty": "Message cannot be empty",
    "string.min": "Message must be at least 1 character long",
    "string.max": "Message cannot exceed 500 characters",
    "any.required": "Message is required"
  }),
});

export {chatSchema}