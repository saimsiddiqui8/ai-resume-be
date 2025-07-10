const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const ProductSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        images: [{ type: String }],
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        category: { type: String, default: '' },
        reviews: [{ type: Types.ObjectId, ref: 'Review' }],
    },
    { timestamps: true },
);

const ProductModel = models.Product || model('Product', ProductSchema);
module.exports = ProductModel;
