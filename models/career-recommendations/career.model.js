import mongoose from "mongoose";

const { Schema } = mongoose;

const CareerSchema = new Schema(
  {
    career_name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    sample_job_titles: {
      type: [String], 
      required: true,
    },
    career_pathways: {
      type: [String], 
      required: true,
    },
    education_training: {
      type: [String],
      required: true,
    },
    career_growth_opportunities: {
      type: String,
      required: true,
      trim: true,
    },
    career_link: {
      type: String,
      default: ""
    },
  },
  {
    timestamps: true,
  }
);

const Career = mongoose.model("Career", CareerSchema);

export default Career;
