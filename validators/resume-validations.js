import Joi from "joi";

// Subschemas for sections
const objectiveSchema = Joi.object({
  description: Joi.string().required(),
});

const experienceSchema = Joi.array().items(
  Joi.object({
    job_title: Joi.string().required(),
    company: Joi.string().required(),
    start_date: Joi.date().required(),
    end_date: Joi.date().allow(null).optional(), // Optional and can be null
    description: Joi.string().allow(null).optional(), // Optional and can be null
  })
);

const educationSchema = Joi.array().items(
  Joi.object({
    institution: Joi.string().required(),
    degree: Joi.string().required(),
    field_of_study: Joi.string().required(),
    start_year: Joi.number().required(),
    end_year: Joi.number().allow(null).optional(), // Optional and can be null
    description: Joi.string().allow(null).optional(), // Optional and can be null
  })
);

const licenseCertificationSchema = Joi.array().items(
  Joi.object({
    certification_name: Joi.string().required(),
    issuing_organization: Joi.string().required(),
    credential_id: Joi.string().allow(null).optional(),
    issue_date: Joi.date().required(),
    expiration_date: Joi.date().allow(null).optional(),
  })
);

const honorAwardSchema = Joi.array().items(
  Joi.object({
    award_name: Joi.string().required(),
    awarding_organization: Joi.string().required(),
    date_Received: Joi.date().required(),
    description: Joi.string().allow(null).optional(),
  })
);

const volunteerExperienceSchema = Joi.array().items(
  Joi.object({
    organization_name: Joi.string().required(),
    role: Joi.string().required(),
    start_year: Joi.number().required(),
    end_year: Joi.number().allow(null).optional(),
    description: Joi.string().allow(null).optional(),
  })
);

// Main Resume Validation Schema
const resumeValidationSchema = Joi.object({
  full_name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().allow("").optional(),
  objective: objectiveSchema.required(),
  experience: experienceSchema.optional(),
  education: educationSchema.optional(),
  licenses_and_certifications: licenseCertificationSchema.optional(),
  soft_skills: Joi.array().items(Joi.string()).optional(),
  technical_skills: Joi.array().items(Joi.string()).optional(),
  honors_and_awards: honorAwardSchema.optional(),
  volunteer_experience: volunteerExperienceSchema.optional(),
});

const updateResumeValidationSchema = Joi.object({
    resume_id: Joi.string().required().regex(/^[a-fA-F0-9]{24}$/).messages({
      "string.pattern.base": "Invalid resume_id format. It must be a valid ObjectId.",
    }),
    
    full_name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().allow("").optional(),
    objective: Joi.object({
      description: Joi.string().optional(),
    }).optional(),
    experience: Joi.array()
      .items(
        Joi.object({
          job_title: Joi.string().optional(),
          company: Joi.string().optional(),
          start_date: Joi.date().optional(),
          end_date: Joi.date().allow(null).optional(),
          description: Joi.string().optional(),
        })
      )
      .optional(),
    education: Joi.array()
      .items(
        Joi.object({
          institution: Joi.string().optional(),
          degree: Joi.string().optional(),
          field_of_study: Joi.string().optional(),
          start_year: Joi.number().optional(),
          end_year: Joi.number().optional(),
          description: Joi.string().optional(),
        })
      )
      .optional(),
    licenses_and_certifications: Joi.array()
      .items(
        Joi.object({
          certification_name: Joi.string().optional(),
          issuing_organization: Joi.string().optional(),
          credential_id: Joi.string().allow(null).optional(),
          issue_date: Joi.date().optional(),
          expiration_date: Joi.date().allow(null).optional(),
        })
      )
      .optional(),
    soft_skills: Joi.array().items(Joi.string()).optional(),
    technical_skills: Joi.array().items(Joi.string()).optional(),
    honors_and_awards: Joi.array()
      .items(
        Joi.object({
          award_name: Joi.string().optional(),
          awarding_organization: Joi.string().optional(),
          date_Received: Joi.date().allow(null).optional(),
          description: Joi.string().allow(null).optional(),
        })
      )
      .optional(),
    volunteer_experience: Joi.array()
      .items(
        Joi.object({
          organization_name: Joi.string().optional(),
          role: Joi.string().optional(),
          start_year: Joi.number().optional(),
          end_year: Joi.number().optional(),
          description: Joi.string().optional(),
        })
      )
      .optional(),
  });

const deleteResumeValidationSchema = Joi.object({
    resume_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid resume_id format.',
      'any.required': 'resume_id is required.',
    }),
  });

  const resumeDetailSchema = Joi.object({
    resumeId: Joi.string().required().length(24).hex(),
  });
  const addSupportPeopleSchema = Joi.object({
    resumeId: Joi.string().required(), // Resume ID is required
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

export {resumeValidationSchema, updateResumeValidationSchema, deleteResumeValidationSchema, addSupportPeopleSchema, resumeDetailSchema}