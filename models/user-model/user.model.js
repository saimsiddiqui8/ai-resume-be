import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    default: ''
    
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default : ''
  },
  password: {
    type: String,
    default: '',
    select : false
  },
  profile_img: {
    type: String,
    default: ''
  },
  state : {
    type: String,
    default: ""
  },
  city : {
    type: String,
    default: ""
  },
  address : {
    type: String,
    default: ""
  },
  
  is_active: {
    type: Boolean,
    default: false
  },
  is_blocked: {
    type: Boolean,
    default: false
},
  is_deleted: {
    type: Boolean,
    default: false
},
is_profile_completed: {
  type: Boolean,
  default: false
},
is_subscription_paid: {
  type: Boolean,
  default: false
},
is_registration_question_completed: {
  type: Boolean,
  default: false
},
current_subscription_plan: {
  type: String,
  default: ""
},
stripe_customer_id: {
  type: String,
  default: '',
},
uid: {
  type: String,
  default: '',
},
tokenInvalidatedAt: { 
  type: Date, 
  default: null 
},
},
{
  timestamps: true
}
);


const User = mongoose.model('User', userSchema);
export default User;