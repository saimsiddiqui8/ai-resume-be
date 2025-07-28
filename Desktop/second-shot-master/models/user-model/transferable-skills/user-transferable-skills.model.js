import mongoose from 'mongoose';

const { Schema } = mongoose;

// Subschema for rank with rankId and descriptionId
const RankFieldSchema = new Schema({
  rankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rank', // Reference to Rank model
    default: null // rankId is required
  },
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
},{ _id: false } // Disable the creation of the _id field
);
const AthleteFieldSchema = new Schema({
    athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SportPosition', // Reference to SportPosition model
    default: null
  },
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
},{ _id: false } // Disable the creation of the _id field
);
const PrimarySportSchema = new Schema({
    sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport', // Reference to SportPosition model
    default: null
  },
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
},{ _id: false } // Disable the creation of the _id field
);
const Favorite_hobbyFieldSchema = new Schema({
    favorite_hobbyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hobbie', // Reference to Hobbie model
    default: null
  },
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
},{ _id: false } // Disable the creation of the _id field
);
const FavoriteSubjectFieldSchema = new Schema({
    favoriteSubjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject', // Reference to Subject model
    default: null
  },
  descriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
},{ _id: false } // Disable the creation of the _id field
);

// Main Schema
const UserTransferableSkillsSchema = new Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true, 
      ref: 'User' // Reference to User model
    },
    rank: {
      type: RankFieldSchema,
      default: null 
    },
    athlete: {
      type: AthleteFieldSchema,
      default: null 
    },
    sport: {
      type: PrimarySportSchema,
      default: null 
    },
    favorite_hobby1: {
      type: Favorite_hobbyFieldSchema,
      default: null 
    },
    favorite_hobby2: {
      type: Favorite_hobbyFieldSchema,
      default: null 
    },
    favorite_middle_school_subject: {
      type: FavoriteSubjectFieldSchema,
      default: null 
    }
  },
  { timestamps: true }
);

const UserTransferableSkills = mongoose.model('UserTransferableSkills', UserTransferableSkillsSchema);
export default UserTransferableSkills;
