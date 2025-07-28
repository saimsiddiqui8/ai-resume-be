const { Schema, model, models, Types } = require('mongoose');

const OrderItemSchema = new Schema(
    {
        product: {
            type: Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
        },
    },
    { _id: false },
);

const OrderSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
        items: [OrderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const OrderModel = models.Order || model('Order', OrderSchema);
module.exports = OrderModel;
