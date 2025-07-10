const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const MessageSchema = new Schema({
    senderType: { type: String, enum: ['patient', 'doctor'], required: true },
    sender: { type: Types.ObjectId, required: true, refPath: 'messages.senderType' },
    text: { type: String },
    media: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ChatSchema = new Schema({
    participantsType: [{ type: String, enum: ['patient', 'doctor'], required: true }],
    participants: [{ type: Types.ObjectId, required: true }],
    messages: [MessageSchema],
    lastMessage: { type: String, default: '' }
}, { timestamps: true });

const ChatModel = models.Chat || model('Chat', ChatSchema);
module.exports = ChatModel;
