import mongoose from 'mongoose';

const { Schema } = mongoose;

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


const transferableSkillsSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Military-related skills
    has_military_service: {
      type: Boolean,
      default: false,
    },
    military: {
      branch_of_service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null, // Null if has_military_service is false
      },
      rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rank',
        default: null, // Null if has_military_service is false
      },
    },

    // Athlete-related skills
    is_athlete: {
      type: Boolean,
      default: false,
    },
    athlete: {
      primary_sport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sport',
        default: null, // Null if is_athlete is false
      },
      sport_position: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SportPosition',
        default: null, // Null if is_athlete is false
      },
    },

    // Hobbies
    favorite_hobby1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hobbie',
      default: null, // Null if no hobby is provided
    },
    favorite_hobby2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hobbie',
      default: null, // Null if no second hobby is provided
    },

    // Middle school subject
    favorite_middle_school_subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null, // Null if no subject is provided
    },
    support_people: {
      type: [SupportPersonSchema],
      validate: {
        validator: function (value) {
          return value.length <= 2; // Maximum 2 support people
        },
        message: "A skills can have a maximum of 2 support people.",
      },
      default: [], // Default to an empty array
    },
  },
  { timestamps: true }
);

const TransferableSkills = mongoose.model('Transferable-Skills', transferableSkillsSchema);

export default TransferableSkills;
