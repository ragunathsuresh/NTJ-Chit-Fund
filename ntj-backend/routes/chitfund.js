const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChitFund = require('../models/ChitFund');
const User = require('../models/User');
const Order = require('../models/Order');
const { sendChitFundApprovalEmail, sendChitFundRejectionEmail } = require('../services/emailService');

const buildPaymentSchedule = (plan) => {
    const baseDate = new Date(plan.startDate || plan.approvedAt || plan.createdAt || new Date());
    const payments = [];

    for (let i = 1; i <= Number(plan.totalMonths || 0); i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(1);

        payments.push({
            month: i,
            dueDate,
            amount: plan.monthlyAmount,
            status: 'pending',
        });
    }

    return payments;
};

const syncPlanPaymentsFromOrders = async (plan) => {
    if (!plan?._id || !plan.userId) {
        return plan;
    }

    let changed = false;
    if (
        ['approved', 'active', 'completed'].includes(plan.status) &&
        (!Array.isArray(plan.payments) || plan.payments.length === 0) &&
        Number(plan.totalMonths) > 0
    ) {
        plan.payments = buildPaymentSchedule(plan);
        changed = true;
    }

    if (!Array.isArray(plan.payments) || plan.payments.length === 0) {
        if (changed) {
            await plan.save();
        }
        return plan;
    }

    const successOrders = await Order.find({
        userId: plan.userId,
        chitFundPlanId: plan._id,
        status: 'Success',
    })
        .select('chitFundMonth paymentId orderId createdAt')
        .sort({ createdAt: 1 });

    const paidMonths = new Map();
    for (const order of successOrders) {
        const month = Number(order.chitFundMonth);
        if (!month || paidMonths.has(month)) continue;
        paidMonths.set(month, order);
    }

    plan.payments.forEach((payment) => {
        const matchedOrder = paidMonths.get(Number(payment.month));
        if (matchedOrder) {
            if (payment.status !== 'paid') {
                payment.status = 'paid';
                changed = true;
            }
            if (!payment.paidDate) {
                payment.paidDate = matchedOrder.createdAt || new Date();
                changed = true;
            }
            const nextTxnId = matchedOrder.paymentId || matchedOrder.orderId || payment.upiTransactionId;
            if (payment.upiTransactionId !== nextTxnId) {
                payment.upiTransactionId = nextTxnId;
                changed = true;
            }
        }
    });

    const paidCount = plan.payments.filter((payment) => payment.status === 'paid').length;
    if ((plan.paidMonths || 0) !== paidCount) {
        plan.paidMonths = paidCount;
        changed = true;
    }

    const nextPayment = plan.payments.find((payment) => payment.status !== 'paid') || null;
    const nextDueDate = nextPayment ? nextPayment.dueDate : null;
    if (String(plan.nextDueDate || '') !== String(nextDueDate || '')) {
        plan.nextDueDate = nextDueDate;
        changed = true;
    }

    const expectedStatus = paidCount >= plan.totalMonths
        ? 'completed'
        : (paidCount > 0 ? 'active' : (plan.status === 'completed' ? 'approved' : plan.status));
    if (plan.status !== expectedStatus && ['approved', 'active', 'completed'].includes(plan.status)) {
        plan.status = expectedStatus;
        changed = true;
    }

    if (changed) {
        await plan.save();
    }

    return plan;
};

// ─────────────────────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────────────────────

// @route   POST /api/chitfund/request
// @desc    Submit a new chit fund request
// @access  Private (User)
router.post('/request', protect, async (req, res) => {
    try {
        const { metalType, requestName, monthlyAmount, totalMonths, userNote } = req.body;

        if (!metalType || !requestName || !monthlyAmount || !totalMonths) {
            return res.status(400).json({ success: false, message: 'metalType, requestName, monthlyAmount, totalMonths are required' });
        }

        if (!requestName.trim()) {
            return res.status(400).json({ success: false, message: 'Request name cannot be empty' });
        }

        if (!['gold', 'silver'].includes(metalType)) {
            return res.status(400).json({ success: false, message: 'metalType must be gold or silver' });
        }

        if (monthlyAmount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum monthly amount is ₹100' });
        }

        if (!Number.isInteger(Number(totalMonths)) || Number(totalMonths) < 1) {
            return res.status(400).json({ success: false, message: 'Total months must be at least 1' });
        }

        const chitFund = await ChitFund.create({
            userId: req.user._id,
            metalType,
            requestName: requestName.trim(),
            monthlyAmount: Number(monthlyAmount),
            totalMonths: Number(totalMonths),
            totalAmount: Number(monthlyAmount) * Number(totalMonths),
            userNote: userNote || '',
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Chit fund request submitted successfully! Waiting for admin approval.',
            data: chitFund
        });
    } catch (error) {
        console.error('ChitFund request error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/chitfund/my
// @desc    Get current user's chit fund plans
// @access  Private (User)
router.get('/my', protect, async (req, res) => {
    try {
        const plans = await ChitFund.find({ userId: req.user._id }).sort({ createdAt: -1 });
        await Promise.all(plans.map((plan) => syncPlanPaymentsFromOrders(plan)));
        res.json({ success: true, data: plans });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/chitfund/active
// @desc    Get user's currently active chit fund
// @access  Private (User)
router.get('/active', protect, async (req, res) => {
    try {
        const active = await ChitFund.findOne({
            userId: req.user._id,
            status: { $in: ['approved', 'active'] }
        });
        if (active) {
            await syncPlanPaymentsFromOrders(active);
        }
        res.json({ success: true, data: active || null });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/chitfund/:id/pay
// @desc    User records a UPI payment for a month
// @access  Private (User)
router.post('/:id/pay', protect, async (req, res) => {
    try {
        const { upiTransactionId, month } = req.body;

        if (!upiTransactionId) {
            return res.status(400).json({ success: false, message: 'UPI Transaction ID is required' });
        }

        const plan = await ChitFund.findOne({ _id: req.params.id, userId: req.user._id });

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Chit fund plan not found' });
        }

        if (!['approved', 'active'].includes(plan.status)) {
            return res.status(400).json({ success: false, message: 'Plan is not active' });
        }

        // Find the payment record for this month
        const targetMonth = month || (plan.paidMonths + 1);
        const paymentRecord = plan.payments.find(p => p.month === targetMonth);

        if (!paymentRecord) {
            return res.status(404).json({ success: false, message: `No payment record found for month ${targetMonth}` });
        }

        if (paymentRecord.status === 'paid') {
            return res.status(400).json({ success: false, message: 'This month is already paid' });
        }

        // Mark as paid
        paymentRecord.status = 'paid';
        paymentRecord.paidDate = new Date();
        paymentRecord.upiTransactionId = upiTransactionId;
        plan.paidMonths += 1;

        // Update next due date
        const nextPayment = plan.payments.find(p => p.status !== 'paid');
        plan.nextDueDate = nextPayment ? nextPayment.dueDate : null;

        // Check if all months paid → complete
        if (plan.paidMonths >= plan.totalMonths) {
            plan.status = 'completed';
            plan.nextDueDate = null;
        } else {
            plan.status = 'active';
        }

        await plan.save();

        res.json({
            success: true,
            message: `Payment for month ${targetMonth} recorded successfully!`,
            data: plan
        });
    } catch (error) {
        console.error('ChitFund payment error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

// @route   GET /api/chitfund/admin/all
// @desc    Admin: Get all chit fund requests
// @access  Private (Admin - checked via role or secret header for now)
router.get('/admin/all', protect, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const plans = await ChitFund.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: plans, total: plans.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/chitfund/admin/:id/approve
// @desc    Admin: Approve a chit fund request and generate payment schedule
// @access  Private (Admin)
router.post('/admin/:id/approve', protect, async (req, res) => {
    try {
        const { adminNote, upiId, adminName } = req.body;
        const plan = await ChitFund.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        if (plan.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Plan is already ${plan.status}` });
        }

        // Set approval details
        plan.status = 'approved';
        plan.approvedAt = new Date();
        plan.approvedBy = adminName || 'Admin';
        plan.adminNote = adminNote || '';
        plan.upiId = upiId || '';
        plan.startDate = new Date();

        // Generate monthly payment schedule
        const payments = [];
        for (let i = 1; i <= plan.totalMonths; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(1); // Due on 1st of each month
            payments.push({
                month: i,
                dueDate,
                amount: plan.monthlyAmount,
                status: 'pending'
            });
        }
        plan.payments = payments;
        plan.nextDueDate = payments[0].dueDate;

        await plan.save();

        // ── Send approval email to user ────────────────────────────────────
        const user = await User.findById(plan.userId);
        if (user?.email) {
            sendChitFundApprovalEmail({
                toEmail: user.email,
                customerName: user.name || 'Valued Customer',
                plan: plan.toObject ? plan.toObject() : plan,
            }).catch(err => console.error('Approval email error (non-fatal):', err.message));
        }

        res.json({
            success: true,
            message: `Chit fund plan approved! ${plan.totalMonths}-month schedule generated.`,
            data: plan
        });
    } catch (error) {
        console.error('Approve plan error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/chitfund/admin/:id/reject
// @desc    Admin: Reject a chit fund request
// @access  Private (Admin)
router.post('/admin/:id/reject', protect, async (req, res) => {
    try {
        const { adminNote } = req.body;
        const plan = await ChitFund.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        plan.status = 'rejected';
        plan.adminNote = adminNote || 'Request rejected by admin.';
        await plan.save();

        // ── Send rejection email to user ────────────────────────────────
        const user = await User.findById(plan.userId);
        if (user?.email) {
            sendChitFundRejectionEmail({
                toEmail: user.email,
                customerName: user.name || 'Valued Customer',
                plan: plan.toObject ? plan.toObject() : plan,
            }).catch(err => console.error('Rejection email error (non-fatal):', err.message));
        }

        res.json({ success: true, message: 'Plan rejected.', data: plan });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
