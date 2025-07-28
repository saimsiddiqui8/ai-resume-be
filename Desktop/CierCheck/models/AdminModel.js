const pkg = require('mongoose');
const { Schema, model, models } = pkg;

// NOT FINALIZED YET !!!
const AdminSchema = new Schema(
    {
        name: {
            type: String,
            default: null,
        },
        email: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: null,
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const AdminModel = models.Admin || model('Admin', AdminSchema);

module.exports = AdminModel;
