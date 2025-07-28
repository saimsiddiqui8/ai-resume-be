import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the Answer Schema
const answerSchema = new Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  careerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Career',
    required: true,
  },
  points: {
    type: Number,
    default : 1 
  },
  answer: {
    type: String,
    required: true, 
  }
}, {
  timestamps: true,
});


const Answer = mongoose.model('Answer', answerSchema);

export default Answer;
