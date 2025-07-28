import mongoose from "mongoose";

const { Schema } = mongoose;

const IdpQuestionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    question_no: {
      type: Number,
      default: 0,
    
    },
  },
  {
    timestamps: true,
  }
);

const IDPQuestion = mongoose.model("IDPQuestion", IdpQuestionSchema);

export default IDPQuestion;
