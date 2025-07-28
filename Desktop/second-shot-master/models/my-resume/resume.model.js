import mongoose from 'mongoose';

const { Schema } = mongoose;

// Subschemas for each section
const ObjectiveSchema = new Schema(
  {
    description: { 
        type: String, 
        required: true 
    },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    job_title: { 
        type: String, 
        required: true 
    },
    company: { 
        type: String, 
        required: true 
    },
    start_date: { 
        type: Date, 
        required: true 
    },
    end_date: { 
        type: Date, 
        default: null // If null, the user is still in this role
    }, 
    description: { 
        type: String, 
        default: null 
    },
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    institution: { 
        type: String, 
        required: true 
    },
    degree: { 
        type: String, 
        required: true 
    },
    field_of_study: { 
        type: String, 
        required: true 
    },
    start_year: { 
        type: Number, 
        required: true 
    },
    end_year: { 
        type: Number, 
        default: null // If null, the user is still pursuing
    }, 
    description: { 
        type: String, 
        default: null 
    },
  },
  { _id: false }
);

const LicenseCertificationSchema = new Schema(
  {
    certification_name: { 
        type: String, 
        required: true 
    },
    issuing_organization: { 
        type: String, 
        required: true 
    },
    credential_id: { 
        type: String, 
        default: null 
    },
    issue_date: { 
        type: Date, 
        required: true 
    },
    expiration_date: { 
        type: Date, 
        default: null // If null, certification does not expire
    }, 
  },
  { _id: false }
);

const HonorAwardSchema = new Schema(
  {
    award_name: { 
        type: String, 
        required: true 
    },
    awarding_organization: { 
        type: String, 
        required: true 
    },
    date_Received: { 
        type: Date, 
        required: true 
    },
    description: { 
        type: String, 
        default: null 
    },
  },
  { _id: false }
);

const VolunteerExperienceSchema = new Schema(
  {
    organization_name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true
     },
    start_year: { 
        type: Number, 
        required: true 
    },
    end_year: {
         type: Number, 
         default: null
         }, // If null, the role is ongoing
    description: { 
        type: String, 
        default: null 
    },
  },
  { _id: false }
);

// Support People Schema
const SupportPersonSchema = new Schema(
    {
      full_name: { 
        type: String, 
        required: false, 
        default: null 
      },
      email_address: { 
        type: String, 
        required: false, 
        default: null 
      },
      phone_number: { 
        type: String, 
        required: false, 
        default: null 
      },
    },
    { _id: false } // Prevent creation of a separate _id for each support person
  );

// Main Resume Schema
const ResumeSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    full_name: { 
        type: String, 
        default: "" 
    },
    email: { 
        type: String, 
        default: "" 
    },
    phone: { 
        type: String, 
        default: "" 
    },
    address: { 
        type: String, 
        default: "" 
    },
    objective: ObjectiveSchema,
    experience: [ExperienceSchema], // Array to allow multiple jobs
    education: [EducationSchema], // Array to allow multiple degrees
    licenses_and_certifications: [LicenseCertificationSchema], // Array for multiple certifications
    soft_skills: { type: [String], default: [] }, // Array of strings
    technical_skills: { type: [String], default: [] }, // Array of strings
    honors_and_awards: [HonorAwardSchema], // Array for multiple awards
    volunteer_experience: [VolunteerExperienceSchema], // Array for multiple volunteer roles
    // Support People Section
    support_people: {
        type: [SupportPersonSchema],
        validate: {
          validator: function (value) {
            return value.length <= 2; // Maximum 2 support people
          },
          message: "A resume can have a maximum of 2 support people.",
        },
        default: [], // Default to an empty array
      },
  },
  { timestamps: true } // To track creation and update times
);

// Compile and export the model
const Resume = mongoose.model('Resume', ResumeSchema);
export default Resume;
