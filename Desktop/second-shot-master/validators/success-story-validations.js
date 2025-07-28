import Joi from 'joi';
import mongoose from 'mongoose';

const successStorySchema = Joi.object({
    name: Joi.string().required(),
    profession: Joi.string().required(),
    profession2: Joi.string().required(),
    current_profession: Joi.string().required(),
    education: Joi.string().optional(),
    experience: Joi.string().optional(),
    most_valuable_transferable_skill: Joi.string().optional(),
    linkedin_profile: Joi.string().required(),
    piece_of_advice: Joi.string().optional(),
    youtube_link: Joi.string()
      .required()
      .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
      .messages({ "string.pattern.base": "YouTube link must be valid" }),
    career_recommendations: Joi.array()
      .items(Joi.string().trim())
      .optional()
      
  });

  // Joi schema for request validation
const getStorySchema = Joi.object({
  story_id: Joi.string().required().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message('Invalid ObjectId');
    }
    return value;
  }),
});

const searchSchema = Joi.object({
  search: Joi.string().trim().allow("").required(),
});
export {successStorySchema, getStorySchema, searchSchema}  