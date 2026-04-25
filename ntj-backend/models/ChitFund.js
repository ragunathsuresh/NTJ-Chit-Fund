const mongoose = require('mongoose');

// Individual monthly payment record
const paymentRecordSchema = new mongoose.Schema({
    month: { type: Number, required: true },       // 1 = first month, 2 = second, etc.
    dueDate: { type: Date, required: true },
    paidDate: { type: Date, default: null },
    amount: { type: Number, required: true },
    upiTransactionId: { type: String, default: null },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    }
});

const chitFundSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Request details
    metalType: {
        type: String,
        enum: ['gold', 'silver'],
        required: true
    },
    requestName: {
        type: String,
        required: [true, 'Request name is required'],
        trim: true
    },
    monthlyAmount: {
        type: Number,
        required: true,
        min: [100, 'Minimum monthly amount is ₹100']
    },
    totalMonths: {
        type: Number,
        required: true,
        min: [1, 'Minimum 1 month']
    },
    totalAmount: {
        type: Number   // monthlyAmount * totalMonths
    },
    purpose: {
        type: String,
        default: 'Gold Chit Fund'
    },
    userNote: {
        type: String,
        default: ''
    },

    // Admin control
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        default: ''
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },  // admin name/id

    // Active plan details (set on approval)
    startDate: { type: Date, default: null },
    nextDueDate: { type: Date, default: null },
    paidMonths: { type: Number, default: 0 },
    upiId: { type: String, default: null },   // admin UPI for payments

    // Monthly payment records (generated on approval)
    payments: [paymentRecordSchema]

}, { timestamps: true });

chitFundSchema.virtual('totalPaid').get(function () {
    return this.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
});

chitFundSchema.virtual('remainingMonths').get(function () {
    return this.totalMonths - this.paidMonths;
});

chitFundSchema.index({ userId: 1, status: 1 });
chitFundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ChitFund', chitFundSchema);
