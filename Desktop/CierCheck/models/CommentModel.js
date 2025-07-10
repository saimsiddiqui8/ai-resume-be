const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const CommentSchema = new Schema({
    authorType: { type: String, enum: ['patient', 'doctor'], required: true },
    author: { type: Types.ObjectId, required: true, refPath: 'authorType' },
    post: { type: Types.ObjectId, ref: 'Post', required: true },
    text: { type: String, required: true, trim: true },
    likes: [{ type: Types.ObjectId, refPath: 'authorType' }],
    favourites: [{ type: Types.ObjectId, refPath: 'authorType' }],
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const CommentModel = models.Comment || model('Comment', CommentSchema);
module.exports = CommentModel;
