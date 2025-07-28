// models/Coupon.js
import mongoose from "mongoose";

const promoSchema = new mongoose.Schema(
  {
    
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      default: "",
      ref: "Coupon"
    },
    code: {
      type: String,
      default: ""
    },
    expirationDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const PromoCode = mongoose.model("PromoCode", promoSchema);
export default PromoCode
