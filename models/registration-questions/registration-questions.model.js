import mongoose from 'mongoose';

const { Schema } = mongoose;

const registrationQuestionsSchema = new Schema(
  {
    userId: 
    { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },

    // Answers to registration questions
    current_grade_level: 
    { 
      type: String, 
      default: null 
    },
    major_trade_or_military: 
    { 
      type: String, 
      default: null 
    },

    highest_degree_completion: 
    { 
      type: String, 
      default: null 
    },

    is_eighteen_or_older: 
    { 
      type: Boolean, 
      default: false 
    },

    has_military_service: 
    { 
      type: Boolean, 
      default: false 
    },
    branch_of_service: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service',
      default: null, // Set to null if the user has not served in the military
      validate: {
        validator: function () {
          // Ensures that branch_of_service is provided if has_military_service is true
          return this.has_military_service ? this.branch_of_service !== null : true;
        },
        message: 'Branch of Service is required when has_military_service is true.',
      },
    },
    
    rank: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Rank', // Refers to the Rank model
      default: null, // Set to null if the user has not served in the military
      validate: {
        validator: function () {
          // Ensures that rank is provided if has_military_service is true
          return this.has_military_service ? this.rank !== null : true;
        },
        message: 'Rank is required when has_military_service is true.',
      },
    },    

    is_athlete: {
      type: Boolean,
      default: false,
    },
    primary_sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport', // Refers to the Sport model
      default: null, // Set to null if the user is not an athlete
      validate: {
        validator: function () {
          // Ensures that primary_sport is provided if is_athlete is true
          return this.is_athlete ? this.primary_sport !== null : true;
        },
        message: 'Primary Sport is required when is_athlete is true.',
      },
    },    
    sport_position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SportPosition', // Refers to the SportPosition model
      default: null, // Set to null if the user is not an athlete
      validate: {
        validator: function () {
          // Ensures that sport_position is provided if is_athlete is true
          return this.is_athlete ? this.sport_position !== null : true;
        },
        message: 'Sport Position is required when is_athlete is true.',
      },
    },    

    favorite_hobby1: 
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Hobbie',
      default: null,
    },
    favorite_hobby2: 
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Hobbie',
      default: null,
    },

    favorite_middle_school_subject: 
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Subject',
      default: null 
    },

    has_job_experience: 
    { 
      type: Boolean, 
      default: false 
    }, // Default is "false"
    recent_job_title: {
      type: String,
      default: null, // Set to null if the user has no job experience
      validate: {
        validator: function () {
          return this.has_job_experience ? this.recent_job_title !== null : true;
        },
        message: 'Recent Job Title is required when has_job_experience is true.',
      },
    },

    desired_career_path: 
    { 
      type: String, 
      default: null 
    },
  },
  { timestamps: true }
);

const RegistrationQuestions = mongoose.model('RegistrationQuestion', registrationQuestionsSchema);

export default RegistrationQuestions;
