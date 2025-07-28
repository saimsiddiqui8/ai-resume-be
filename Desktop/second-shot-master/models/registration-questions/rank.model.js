import mongoose from 'mongoose';

const { Schema } = mongoose;

// Rank Topic Schema
const rankTopicSchema = new Schema({
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
const rankSchema = new Schema({
  rank_name: { 
    type: String, 
    required: true 
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  topics: [rankTopicSchema],
}, {
  timestamps: true
});


const Rank = mongoose.model('Rank', rankSchema);

export default Rank;
