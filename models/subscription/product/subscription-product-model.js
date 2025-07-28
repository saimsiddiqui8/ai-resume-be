import mongoose from 'mongoose';

const { Schema } = mongoose;

const subscriptionProductSchema = new Schema({
  stripe_product_id: {
    type: String,
    default: ''
  },
  stripe_price_id: {
    type: String,
    default: ''
  },
  product_name: {
    type: String,
    default: ''
  },
  description: {
    type: Map,
    of: String,
  },
  product_type: {
    type: String,
    enum: [
      "subscription",
    ],
    default: "subscription"
  },
  price: {
    type: Number,
  },
  subscription_duration:{
    type: String,
    default: ''
  },
}, {timestamps: true});


const SubscriptionProduct = mongoose.model("SubscriptionProduct", subscriptionProductSchema);
export default SubscriptionProduct;
