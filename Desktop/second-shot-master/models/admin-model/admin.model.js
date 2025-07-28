import mongoose from 'mongoose';

const { Schema } = mongoose;

const adminSchema = new Schema({
  name: {
    type: String,
    default: ''
    
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
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
  
  is_active: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
},

is_subscription_paid: {
  type: Boolean,
  default: false
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


const Admin = mongoose.model('Admin', adminSchema);
export default Admin;