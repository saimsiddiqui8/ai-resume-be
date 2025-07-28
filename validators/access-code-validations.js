import Joi from "joi";

const accessCodeSchema = Joi.object({
    userId: Joi.string().required().messages({
        "string.base": "User ID must be a string.",
        "string.empty": "User ID is required.",
        "any.required": "User ID is required.",
    }),
});

const verifyAccessCodeSchema = Joi.object({
    code: Joi.string().length(6).required().messages({
        "string.base": "Code must be a string.",
        "string.length": "Code must be exactly 6 characters long.",
        "string.empty": "Code is required.",
        "any.required": "Code is required.",
    }),
});

export {accessCodeSchema, verifyAccessCodeSchema}