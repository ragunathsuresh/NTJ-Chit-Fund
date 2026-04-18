const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
    metalType: {
        type: String,
        enum: ['gold', 'silver'],
        required: true,
        index: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
priceHistorySchema.index({ metalType: 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
