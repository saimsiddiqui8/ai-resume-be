const pkg = require('mongoose');
const { Schema, model, models } = pkg;

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
        signUpRecord: {
            type: Schema.Types.ObjectId,
            ref: 'SignUp',
            select: false,
        },
        uid: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

const AdminModel = models.Admin || model('Admin', AdminSchema);

module.exports = AdminModel;
