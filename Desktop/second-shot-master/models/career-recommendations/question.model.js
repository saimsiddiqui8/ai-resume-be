import mongoose from "mongoose";

const { Schema } = mongoose;

const QuestionSchema = new Schema(
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

const Question = mongoose.model("Question", QuestionSchema);

export default Question;
