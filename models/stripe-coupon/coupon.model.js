// models/Coupon.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    percent_off: {
      type: Number,
      required: true,
    },
    stripe_coupon_id: {
      type: String,
      required: true,
      unique: true,
    },
    duration: {
      type: String,
      default: "once",
    },
    max_redemptions: {
      type: Number,
      default: 1,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon
