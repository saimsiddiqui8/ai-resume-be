import mongoose from 'mongoose';

const { Schema } = mongoose;

const SuccessStorySchema = new Schema(
  {
    name: {
      type: String,
      default : "",
      trim: true, // Removes extra whitespace
    },
    profile_img: {
        type: String,
        required: false,
        default: "", 
      },
    profession: {
      type: String,
      default : "",
      trim: true,
    },
    profession2: {
      type: String,
      default : "",
      trim: true,
    },
    current_profession: {
      type: String,
      default : "",
      trim: true,
    },
    education: {
      type: String,
      default : "",
      trim: true,
    },
    experience: {
      type: String,
      default : "",
      trim: true,
    },
    most_valuable_transferable_skill: {
      type: String,
      default : "",
      trim: true,
    },
    piece_of_advice: {
      type: String,
      default: "",
      trim: true,
    },
    school : {
      type: String,
      default: "",
    },
    youtube_link: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(v); // Validates YouTube URLs
        },
        message: 'Invalid YouTube link!',
      },
      trim: true,
    },
    linkedin_profile: {
      type: String,
      required: false,
      default: ""
    },
    career_recommendations: {
        type: [String],
        default: [],
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SuccessStory = mongoose.model('SuccessStory', SuccessStorySchema);

export default SuccessStory;
