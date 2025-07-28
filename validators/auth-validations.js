import Joi from "joi";

const signUpSchema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(15).optional().messages({
      "string.base": "Phone number must be a string",
      "string.empty": "Phone number is required",
      "string.min": "Phone number must be at least 12 characters",
      "string.max": "Phone number must not exceed 15 characters",
      "any.required": "Phone number is required"
  }),
    password: Joi.string()
    .min(8)
    .max(30)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    }),
    confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match'
    }),
    idToken: Joi.string().required(),
    
  });
  const verifyUserSchema = Joi.object({
    email: Joi.string().email().required(),
});

const verifyOTPSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().required(),
    phone: Joi.string().optional(),
    type: Joi.string().optional()
  });
const forgetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    
  });

const resendOTPSchema = Joi.object({
    email: Joi.string().email().required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),

})
const verifyOTPPhoneSchema = Joi.object({
  phone: Joi.string().min(12).max(15).required().messages({
    "string.base": "Phone number must be a string",
    "string.empty": "Phone number is required",
    "string.min": "Phone number must be at least 12 characters",
    "string.max": "Phone number must not exceed 15 characters",
    "any.required": "Phone number is required"
}),
  otp: Joi.string().required(),
});
const resendOTPPhoneSchema = Joi.object({
  phone: Joi.string().min(12).max(15).required().messages({
    "string.base": "Phone number must be a string",
    "string.empty": "Phone number is required",
    "string.min": "Phone number must be at least 12 characters",
    "string.max": "Phone number must not exceed 15 characters",
    "any.required": "Phone number is required"
})

});
const registerPhoneSchema = Joi.object({
  phone: Joi.string().min(12).max(15).required().messages({
    "string.base": "Phone number must be a string",
    "string.empty": "Phone number is required",
    "string.min": "Phone number must be at least 12 characters",
    "string.max": "Phone number must not exceed 15 characters",
    "any.required": "Phone number is required"
}),
email: Joi.string().email().required().messages({
  "string.base": "Email must be a string",
  "string.email": "Email must be a valid email",
  "any.required": "Email is required",
}),
})

const verifyRegisteredOtpSchema = Joi.object({
  otp: Joi.string().required().messages({
    "string.base": "OTP must be a string",
    "string.empty": "OTP is required",
    "any.required": "OTP is required"
  }),
  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
    "any.required": "Email is required",
  }),

});
// social sign up
const socialSchema = Joi.object({
  email: Joi.string().email().required(),
  idToken: Joi.string().required(),
  name: Joi.string().optional(),
 
});

const locationSchema = Joi.object({
  city: Joi.string().required(),
  state: Joi.string().required()
});
const documentSchema = Joi.object({
  boat_images: Joi.array().items(Joi.string().uri()).min(1).required(),
  // cover_image: Joi.string().uri().required(),
  boat_registration_certificate: Joi.string().uri().required(),
  boat_mooring_agreement: Joi.string().uri().required(),
  boat_ownership_certificate: Joi.string().uri().required(),
  boat_insurance_papers: Joi.string().uri().optional(),
});
const boatValidationSchema = Joi.object({
  boat_name: Joi.string().required(),
  boat_price: Joi.string().required(),
  boat_description: Joi.string().required(),
  number_of_seats: Joi.number().integer().min(1).required(),
  boat_category: Joi.string().valid("Deck Boats", "Sail Boats", "Jet Boats", "BowRiders").required(),
  location: locationSchema,
  isInsured: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  isSuspended: Joi.boolean().default(false),
  isPromoted:Joi.boolean().default(false),
  boat_booking: Joi.string().valid("Per Day", "Per Hour").required(),
  booking_date_time: Joi.date().iso().required(),
  isScheduled: Joi.boolean().default(false),
  availability: Joi.string(),
  availabilityPerHour: Joi.string().optional(),
  address: Joi.string().required(),
  chosenCoverImageIndex: Joi.number().required(),
  documents: documentSchema
});
const adminsignUpSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
  .min(8)
  .max(30)
  .required()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,30}$'))
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  }),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),  
});

const deleteBoatvalidationSchema = Joi.object({
  boatId: Joi.string().trim().required().messages({
    "string.empty": "boatId is required",
    "any.required": "boatId is required",
  }),
});

const Uidschema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('renter', 'lister').required(),
  uid: Joi.string().required(),
});

const logoutSchema = Joi.object({
  deviceId: Joi.string().optional()
});

export {
  signUpSchema,
  verifyUserSchema,
  verifyOTPSchema,
  forgetPasswordSchema,
  resendOTPSchema,
  loginSchema,
  resetPasswordSchema,
  resendOTPPhoneSchema,
  verifyOTPPhoneSchema,
  socialSchema,
  adminsignUpSchema,
  boatValidationSchema,
  deleteBoatvalidationSchema,
  registerPhoneSchema,
  verifyRegisteredOtpSchema,
  Uidschema,
  logoutSchema
};

