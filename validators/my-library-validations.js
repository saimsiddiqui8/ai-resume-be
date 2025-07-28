import Joi from 'joi';

// Joi validation schema
const transferableSkillSchema = Joi.object({
    rank: Joi.object({
      rankId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
    athlete: Joi.object({
      athleteId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
    sport: Joi.object({
      sportId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
    favorite_hobby1: Joi.object({
      favorite_hobbyId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
    favorite_hobby2: Joi.object({
      favorite_hobbyId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
    favorite_middle_school_subject: Joi.object({
      favoriteSubjectId: Joi.string().optional(),
      descriptionId: Joi.string().optional(),
    }).optional(),
  });

export {transferableSkillSchema}  