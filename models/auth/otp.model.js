import mongoose from "mongoose";

const { Schema } = mongoose;

const otpSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  otp_retries: {
    type: Number,
    default: 0,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  lastRetryTime: {
    type: Date,
    default: Date.now,
  },
});

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
