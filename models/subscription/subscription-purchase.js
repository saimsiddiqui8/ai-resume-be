import mongoose from 'mongoose';

const { Schema } = mongoose;

const subscriptionPurchaseSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentIntent_id : {
    type: String,
    default: ""
  },
  purchase_token : {
    type: String,
    default: ""
  },
  subscription_id : {
    type: String,
    default: ""
  },
  subscription_price : {
    type: Number,
    default: 0,
  },
  subscription_plan : {
    type: String,
    default: ""
  },
  platform : {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "active", "cancelled", "expired"],
      message: "Status must be either pending or active or cancelled",
    },
    default: "pending",
  },
  renewed: {
    type: Number,
    default: 0,
  },

},{
  timestamps: true
});

const SubscriptionPurchase = mongoose.model('SubscriptionPurchase', subscriptionPurchaseSchema);

export default SubscriptionPurchase;