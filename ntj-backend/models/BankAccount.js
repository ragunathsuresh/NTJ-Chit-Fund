const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
    },
    accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        trim: true
    },
    ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
        trim: true,
        uppercase: true
    },
    accountHolder: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure only one primary account per user
bankAccountSchema.pre('save', async function (next) {
    if (this.isPrimary) {
        await this.constructor.updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isPrimary: false }
        );
    }
    next();
});

// Index for faster queries
bankAccountSchema.index({ userId: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
