import mongoose from "mongoose";

const accessCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  is_used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // expires: 900, // Auto-delete the code after 15 minutes
  },
});



const AccessCode = mongoose.model("AccessCode", accessCodeSchema);

export default AccessCode;
