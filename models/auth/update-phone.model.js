import mongoose from "mongoose";

const { Schema } = mongoose;

const phoneUpdateSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  newPhone: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '5m' // OTP will automatically be deleted after 10 minutes
  }
});

const PhoneUpdate = mongoose.model("PhoneUpdate", phoneUpdateSchema);
export default PhoneUpdate;
