import Joi from 'joi';
import mongoose from 'mongoose';

const createGoalSchema = Joi.object({
    
    main_goal_name: Joi.string().required().trim(),
    deadline: Joi.date().required(),
    sub_goals: Joi.array().items(
      Joi.object({
        name: Joi.string().required().trim(),
        deadline: Joi.date().required(),
      })
    ),
    support_people: Joi.array()
      .items(
        Joi.object({
          full_name: Joi.string().required().trim(),
          email_address: Joi.string()
            .required()
            .trim()
            .email({ tlds: { allow: false } }),
          phone_number: Joi.string()
            .required()
            .trim()
        })
      )
      .max(2), // Maximum of 2 support people
  });
  const goalDetailsSchema = Joi.object({
    goalId: Joi.string().required()
  });

  const changeGoalStatusSchema = Joi.object({
    goalId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message('Invalid goalId');
        }
        return value;
      }),
  });

  const updateSubGoalSchema = Joi.object({
    goalId: Joi.string().required().messages({
      'any.required': 'goalId is required',
      'string.empty': 'goalId cannot be empty',
    }),
    subGoalId: Joi.string().required().messages({
      'any.required': 'subGoalId is required',
      'string.empty': 'subGoalId cannot be empty',
    }),
  });

  // Joi Validation Schema
const addSupportPeopleGoalSchema = Joi.object({
    goalId: Joi.string().required(),
    supportPeople: Joi.array()
      .items(
        Joi.object({
          full_name: Joi.string().required(),
          email_address: Joi.string()
            .email()
            .required(),
          phone_number: Joi.string().required()
        })
      )
      .min(1)
      .max(2)
      .required()
  });

  const deleteGoalSchema = Joi.object({
    goalId: Joi.string().required()
  });

export {createGoalSchema, goalDetailsSchema, changeGoalStatusSchema, updateSubGoalSchema, addSupportPeopleGoalSchema, deleteGoalSchema}  