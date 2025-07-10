const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const PatientSchema = new Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, unique: true },
    profilePicURL: { type: String, default: '' },
    bio: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneNumberVerified: { type: Boolean, default: false },
    followers: [{ type: Types.ObjectId, ref: 'Patient' }],
    following: [{ type: Types.ObjectId, ref: 'Patient' }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

PatientSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

PatientSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};

const PatientModel = models.Patient || model('Patient', PatientSchema);
module.exports = PatientModel;
