import Joi from 'joi';
import mongoose from 'mongoose';

const submitIDPFormSchema = Joi.object({  
    data: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string()
            .required()
            .custom((value, helpers) => {
              if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
              }
              return value;
            })
            .messages({
              'any.required': 'Question ID is required',
              'any.invalid': 'Invalid Question ID',
            }),
          answer: Joi.alternatives().try(
            Joi.string().allow(''),
            Joi.array().items(Joi.string()),
            Joi.valid(null)
          ).messages({
            'alternatives.match': 'Answer must be a string, an array of strings, or null',
          }),
        })
      )
      .length(5) // exactly 5 answers expected
      .required()
      .messages({
        'array.length': 'Exactly 5 answers are required',
        'any.required': 'Data is required',
      }),
  });

  const updateIDPAnswerSchema = Joi.object({
    questionId: Joi.string().required().messages({
      "any.required": "Question ID is required.",
      "string.base": "Question ID must be a string.",
    }),
    answer: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string()),
      Joi.allow(null)
    ).required().messages({
      "any.required": "Answer is required."
    }),
  });

  const addSupportPeopleSchema = Joi.object({
      supportPeople: Joi.array()
        .items(
          Joi.object({
            full_name: Joi.string().required(),
            email_address: Joi.string().email().required(),
          })
        )
        .max(2) // Ensure no more than 2 support people are added
        .required(),
    });
 export {submitIDPFormSchema, updateIDPAnswerSchema, addSupportPeopleSchema} 