import mongoose from "mongoose";

const { Schema } = mongoose;

const registerPhoneSchema = new Schema({
 email: {
    type: String,
    required: true
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

const PhoneRegister = mongoose.model("PhoneRegister", registerPhoneSchema);
export default PhoneRegister;
