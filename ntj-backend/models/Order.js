const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
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
    metalName: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        default: null
    },
    amountPaid: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    ratePerGram: {
        type: Number,
        required: [true, 'Rate per gram is required'],
        min: [0, 'Rate must be positive']
    },
    gramsCredited: {
        type: Number,
        required: [true, 'Grams is required'],
        min: [0, 'Grams must be positive']
    },
    status: {
        type: String,
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending'
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    // Chit Fund linkage (optional — set when order is for a chit fund plan)
    chitFundPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChitFund',
        default: null
    },
    chitFundMonth: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
