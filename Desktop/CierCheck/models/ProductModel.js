const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const ProductSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        images: [
            {
                type: String,
            },
        ],
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            default: '',
        },
    },
    { timestamps: true },
);

const ProductModel = models.Product || model('Product', ProductSchema);
module.exports = ProductModel;
