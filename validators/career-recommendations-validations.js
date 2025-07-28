import Joi from "joi";

const addQuestionSchema = Joi.object({
  question: Joi.string().trim().required().messages({
    "string.base": "Question must be a string.",
    "string.empty": "Question cannot be empty.",
    "any.required": "Question is required.",
  }),
});
const addCareerSchema = Joi.object({
  career_name: Joi.string().trim().required()
});

const answerValidationSchema = Joi.object({
  questionId: Joi.string().required(),
  careerId: Joi.string().required(), 
  answer: Joi.string().required(),
});

const assessmentSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // Validate MongoDB ObjectId
        answer: Joi.string().required(),
      })
    )
    .length(24)
    .required(),
});

const validateCareerRecommendation = Joi.object({
  recommendationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  careers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).required()
});
const validateCareerRecommendationDetails = Joi.object({
  recommendationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
});

const validateFavoriteDetails = Joi.object({
  favoriteId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.pattern.base": "Invalid favoriteId format",
      "any.required": "favoriteId is required"
  })
});

const validateToggleFavorite = Joi.object({
  recommendationId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.pattern.base": "Invalid recommendationId format",
      "any.required": "recommendationId is required"
  }),
  careerId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.pattern.base": "Invalid careerId format",
      "any.required": "careerId is required"
  })
});

export {addQuestionSchema, addCareerSchema, answerValidationSchema, assessmentSchema, validateCareerRecommendation, validateCareerRecommendationDetails, validateFavoriteDetails, validateToggleFavorite}