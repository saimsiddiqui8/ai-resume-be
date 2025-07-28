const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const MediaSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['image', 'video'],
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const PostSchema = new Schema(
    {
        author: {
            type: Types.ObjectId,
            required: true,
            ref: 'User',
        },
        text: {
            type: String,
            required: false,
            trim: true,
        },
        media: {
            type: [MediaSchema],
            required: false,
        },
        favouriteCount: {
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

const PostModel = models.Post || model('Post', PostSchema);
module.exports = PostModel;
