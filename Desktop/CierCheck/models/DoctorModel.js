const { Schema, model, models, Types } = require('mongoose');

// Define Doctor Schema
const DoctorSchema = new Schema(
    {
        // Basic Info
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            sparse: true,
            minlength: 3,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, required: true },
        phone: { type: String, unique: true, sparse: true },

        // Profile
        profilePicture: { type: String, default: '' },
        bio: { type: String, default: '' },
        specialty: { type: String, required: true, trim: true },
        contactInfo: { type: String, default: '' },

        // Status flags
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const DoctorModel = models.Doctor || model('Doctor', DoctorSchema);
module.exports = DoctorModel;
