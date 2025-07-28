import mongoose from "mongoose";

const { Schema } = mongoose;

const SubscriptionRecordSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
    },
    clientSecret: {
      type: String,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, 
      expires: 43200,
    },
  },
  {
    timestamps: false,
  }
);

const SubscriptionRecord = mongoose.model("SubscriptionRecord", SubscriptionRecordSchema);

export default SubscriptionRecord;
