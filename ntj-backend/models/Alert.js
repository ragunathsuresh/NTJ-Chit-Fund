const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metalType: {
        type: String,
        enum: ['gold', 'silver'],
        required: [true, 'Metal type is required']
    },
    label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['UPPER', 'LOWER', 'TARGET'],
        required: [true, 'Alert type is required']
    },
    targetPrice: {
        type: Number,
        required: [true, 'Target price is required'],
        min: [0, 'Price must be positive']
    },
    marketPrice: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    triggered: {
        type: Boolean,
        default: false
    },
    triggeredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
alertSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);
