const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const AddressSchema = new Schema(
    {
        user: { type: Types.ObjectId, ref: 'User', required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const AddressModel = models.Address || model('Address', AddressSchema);
module.exports = AddressModel;