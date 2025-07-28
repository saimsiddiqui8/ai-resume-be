import mongoose from 'mongoose';

const { Schema } = mongoose;

const sportsTopicSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
}, { _id: true }); // Allowing auto-generated topic IDs
const sportsSchema = new Schema(
  {
    sport_name: {
      type: String,
      default: ""
    },
    topics: [sportsTopicSchema],
  },
  { timestamps: true }
);

const Sport = mongoose.model('Sport', sportsSchema);

export default Sport;
