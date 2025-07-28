import Joi from "joi";
import mongoose from "mongoose";

const registrationQuestionsValidationSchema = Joi.object({
  current_grade_level: Joi.string().required(),
  major_trade_or_military: Joi.string().required(),
  highest_degree_completion: Joi.string().allow("").optional(),
  is_eighteen_or_older: Joi.boolean().default(false).required(),
  has_military_service: Joi.boolean().default(false).required(),
  branch_of_service: Joi.string().allow(null).when('has_military_service', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  rank: Joi.string().allow(null).when('has_military_service', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  is_athlete: Joi.boolean().default(false).required(),
  primary_sport: Joi.string().allow(null).when('is_athlete', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  sport_position: Joi.string().allow(null).when('is_athlete', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  favorite_hobby1: Joi.string().required(),
  favorite_hobby2: Joi.string().required(),
  favorite_middle_school_subject: Joi.string().required(),
  has_job_experience: Joi.boolean().default(false).required(),
  recent_job_title: Joi.string().allow(null).when('has_job_experience', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(null),
  }),
  desired_career_path: Joi.string().required(),
});

const serviceValidationSchema = Joi.object({
  service_name: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': 'Service name cannot be empty.',
      'string.min': 'Service name must be at least 3 characters long.',
      'string.max': 'Service name must not exceed 50 characters.',
      'any.required': 'Service name is required.',
    }),
});

const createRankSchema = Joi.object({
  rank_name: Joi.string().required(),
  serviceId: Joi.string().required(),
  topics: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required()
    })
  ).length(5).required(),
});

const sportValidationSchema = Joi.object({
  sport_name: Joi.string().trim().min(3).max(50).required()
    .messages({
      'string.empty': 'Sport name cannot be empty.',
      'string.min': 'Sport name must be at least 3 characters long.',
      'string.max': 'Sport name must not exceed 50 characters.',
      'any.required': 'Sport name is required.',
    }),
});

const addSportPositionSchema = Joi.object({
  position_name: Joi.string().required(),
  sportId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('Invalid sportId');
      }
      return value;
    })
    .required(),
  topics: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
      })
    )
    .length(5)
    .required(),
});

const createHobbieSchema = Joi.object({
  hobbie_name: Joi.string().required(),
  topics: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
      })
    )
    .length(5)
    .required(),
});

const createSubjectSchema = Joi.object({
  subject_name: Joi.string().required(),
  topics: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
      })
    )
    .length(5)
    .required(),
});

const addSupportPeopleSchema = Joi.object({
    supportPeople: Joi.array()
      .items(
        Joi.object({
          full_name: Joi.string().required(),
          email_address: Joi.string().email().required(),
          phone_number: Joi.string().required(),
        })
      )
      .max(2) // Ensure no more than 2 support people are added
      .required(),
  });

export {registrationQuestionsValidationSchema, serviceValidationSchema, createRankSchema, sportValidationSchema, addSportPositionSchema, createHobbieSchema, createSubjectSchema, addSupportPeopleSchema};
