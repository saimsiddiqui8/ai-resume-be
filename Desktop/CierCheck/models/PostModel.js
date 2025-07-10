const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const MediaSchema = new Schema({
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true }
}, { _id: false });

const PostSchema = new Schema({
    authorType: { type: String, enum: ['patient', 'doctor'], required: true },
    author: { type: Types.ObjectId, required: true, refPath: 'authorType' },
    text: { type: String, required: true, trim: true },
    media: [MediaSchema],
    comments: [{ type: Types.ObjectId, ref: 'Comment' }],
    favourites: [{ type: Types.ObjectId, refPath: 'authorType' }],
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const PostModel = models.Post || model('Post', PostSchema);
module.exports = PostModel;
