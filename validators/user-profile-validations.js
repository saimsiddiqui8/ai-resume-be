import Joi from "joi";

const deviceTokenSchema = Joi.object({
  deviceId: Joi.string().required(),  // Unique ID for each device
  deviceToken: Joi.string().required()
});

const profileSchema = Joi.object({
  profile_img: Joi.any().allow('', null).optional(),
 
});
const setProfileSchema = Joi.object({
state: Joi.string().required(),
city: Joi.string().required(),
address: Joi.string().allow("").optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().optional().max(100),
  state: Joi.string().optional().max(100),
  city: Joi.string().optional().max(100),
  address: Joi.string().allow("").optional().max(255),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
      .min(8)
      .max(30)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      }),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required(),
});

const verifyPasswordSchema = Joi.object({
  current_password: Joi.string().required(),
});
export { setProfileSchema, profileSchema, updateProfileSchema, changePasswordSchema, deviceTokenSchema, verifyPasswordSchema };
