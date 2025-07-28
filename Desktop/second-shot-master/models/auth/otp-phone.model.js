import mongoose from "mongoose";

const { Schema } = mongoose;

const otpPhoneSchema = new Schema({
  phone: {
     type: String,
     required: true 
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

const OTPPhone = mongoose.model("OTP-Phone", otpPhoneSchema);
export default OTPPhone;
