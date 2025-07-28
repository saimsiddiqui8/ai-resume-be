const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const CommentSchema = new Schema(
    {
        author: {
            type: Types.ObjectId,
            required: true,
            ref: 'User',
        },
        post: {
            type: Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        mentionedUsers: [
            {
                type: Types.ObjectId,
                ref: 'User',
            },
        ],
        likesCount: {
            type: Number,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const CommentModel = models.Comment || model('Comment', CommentSchema);
module.exports = CommentModel;
