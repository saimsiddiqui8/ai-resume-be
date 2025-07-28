import Joi from "joi";


const transferableSkillsSchema = Joi.object({
    userId: Joi.string().required(),
});
const careerRecommendationssSchema = Joi.object({
    userId: Joi.string().required(),
});
const validateCareerRecommendationDetails = Joi.object({
  recommendationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
});
const resumeSchema = Joi.object({
    userId: Joi.string().required(),
});
const notificationSchema = Joi.object({
    notification_title: Joi.string().required().messages({
      'string.empty': 'Notification title is required',
      'any.required': 'Notification title is required',
    }),
    notification_message: Joi.string().required().messages({
      'string.empty': 'Notification message is required',
      'any.required': 'Notification message is required',
    }),
  });
export {transferableSkillsSchema, careerRecommendationssSchema, validateCareerRecommendationDetails, resumeSchema, notificationSchema}
