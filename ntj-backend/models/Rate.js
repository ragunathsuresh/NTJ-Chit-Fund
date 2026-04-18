const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
    metalType: {
        type: String,
        enum: ['gold', 'silver'],
        required: true
    },
    purity: {
        type: String, // e.g., '24K', '99.9%'
        required: true
    },
    buyPrice: {
        type: Number,
        required: true
    },
    sellPrice: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Rate', rateSchema);
