const pkg = require('mongoose');
const { Schema, model, models } = pkg;

const VideoSchema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        url: { type: String, required: true },
        category: { type: String, default: '' },
    },
    { timestamps: true },
);

const VideoModel = models.Video || model('Video', VideoSchema);
module.exports = VideoModel;
