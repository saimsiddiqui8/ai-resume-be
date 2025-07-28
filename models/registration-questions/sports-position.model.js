import mongoose from 'mongoose';

const { Schema } = mongoose;

// Rank Topic Schema
const positionTopicSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
}, { _id: true }); // Allowing auto-generated topic IDs

// Rank Schema
const sportPositionSchema = new Schema({
    position_name: { 
    type: String, 
    required: true 
  },
  sportId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sport', 
    required: true 
  },
  topics: [positionTopicSchema],
}, {
  timestamps: true
});

// Creating the SportPosition model
const SportPosition = mongoose.model('SportPosition', sportPositionSchema);

export default SportPosition;