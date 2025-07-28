import mongoose from 'mongoose';

const { Schema } = mongoose;

// Hobbies Schema
const hobbiesTopicSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
}, { _id: true }); // Allowing auto-generated topic IDs

// Hobbies Schema
const hobbiesSchema = new Schema({
    hobbie_name: { 
    type: String, 
    required: true 
  },
  topics: [hobbiesTopicSchema],
}, {
  timestamps: true
});

// Creating the Hobbie model
const Hobbie = mongoose.model('Hobbie', hobbiesSchema);

export default Hobbie;