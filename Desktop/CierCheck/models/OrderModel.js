const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const AddressSchema = new Schema({
    line1: String,
    line2: String,
    city: String,
    state: String,
    zip: String,
    country: String
}, { _id: false });

const OrderProductSchema = new Schema({
    product: { type: Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 }
}, { _id: false });

const OrderSchema = new Schema({
    patient: { type: Types.ObjectId, ref: 'Patient', required: true },
    products: [OrderProductSchema],
    totalAmount: { type: Number, required: true },
    address: AddressSchema,
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, default: '' }
}, { timestamps: true });

const OrderModel = models.Order || model('Order', OrderSchema);
module.exports = OrderModel;
