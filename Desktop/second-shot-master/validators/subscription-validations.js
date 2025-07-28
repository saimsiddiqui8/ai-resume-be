import Joi from 'joi';


const subscriptionProductSchema = Joi.object({
    product_name: Joi.string().required(),
    description: Joi.object().pattern(
        Joi.string(), 
        Joi.string() 
      ).required(),
    price: Joi.number().required(),
    subscription_duration: Joi.string().required(),
});
const createSubscriptionSchema = Joi.object({
    product_id: Joi.string().required(),
    promoCode: Joi.string().optional(),
});

const verifySubscriptionSchema = Joi.object({
  product_id: Joi.string().required(),
  stripeSubscriptionId: Joi.string().required(),
  paymentIntentId: Joi.string().required(),
    
});

const subscriptionVerifySchema = Joi.object({
  subscription: Joi.string().required(),
  purchase_token: Joi.string().required(),
  product_id: Joi.string().required(),
});

const couponSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Coupon name is required",
    "string.empty": "Coupon name cannot be empty",
  }),
  percent_off: Joi.number().min(1).max(100).required().messages({
    "any.required": "Percentage off is required",
    "number.base": "Percentage off must be a number",
    "number.min": "Minimum discount is 1%",
    "number.max": "Maximum discount is 100%",
  }),
});

const promotionCodeSchema = Joi.object({
  couponId: Joi.string().required().messages({
    "any.required": "Coupon ID is required",
    "string.empty": "Coupon ID cannot be empty",
  }),
  code: Joi.string().alphanum().min(4).max(20).required().messages({
    "any.required": "Promotion code is required",
    "string.empty": "Promotion code cannot be empty",
    "string.alphanum": "Promotion code must be alphanumeric",
    "string.min": "Promotion code must be at least 4 characters",
    "string.max": "Promotion code must be at most 20 characters",
  }),
  expirationDate: Joi.date().greater("now").required().messages({
    "date.base": "Expiration date must be a valid date",
    "date.greater": "Expiration date must be in the future",
  }),
});

const verifyPromotionCodeSchema = Joi.object({
  code: Joi.string().required().messages({
    "any.required": "Promotion code is required.",
    "string.empty": "Promotion code cannot be empty.",
  }),
});
export {subscriptionProductSchema, createSubscriptionSchema, verifySubscriptionSchema, subscriptionVerifySchema, couponSchema, promotionCodeSchema, verifyPromotionCodeSchema}