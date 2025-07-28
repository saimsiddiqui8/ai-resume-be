import mongoose from 'mongoose';

const { Schema } = mongoose;

// Subject Schema
const subjectsTopicSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
}, { _id: true }); // Allowing auto-generated topic IDs

// Subject Schema
const subjectsSchema = new Schema({
    subject_name: { 
    type: String, 
    required: true 
  },
  topics: [subjectsTopicSchema],
}, {
  timestamps: true
});

// Creating the Subject model
const Subject = mongoose.model('Subject', subjectsSchema);

export default Subject;