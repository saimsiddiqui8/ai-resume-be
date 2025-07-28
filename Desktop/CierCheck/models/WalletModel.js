const pkg = require('mongoose');
const { Schema, model, models, Types } = pkg;

const TransactionSchema = new Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false },
);

const WalletSchema = new Schema(
    {
        ownerType: {
            type: String,
            enum: ['patient', 'doctor'],
            required: true,
        },
        owner: {
            type: Types.ObjectId,
            required: true,
            refPath: 'ownerType',
        },
        balance: {
            type: Number,
            default: 0,
        },
        transactions: [TransactionSchema],
    },
    { timestamps: true },
);

const WalletModel = models.Wallet || model('Wallet', WalletSchema);
module.exports = WalletModel;
