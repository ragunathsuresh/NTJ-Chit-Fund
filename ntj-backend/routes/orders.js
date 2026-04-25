const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const User  = require('../models/User');
const ChitFund = require('../models/ChitFund');
const { sendPaymentBillEmail } = require('../services/emailService');

// @route   GET /api/orders/balance
// @desc    Get current user's gold & silver balance directly from DB
// @access  Private
router.get('/balance', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('goldBalance silverBalance name');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({
            success: true,
            data: {
                goldBalance: user.goldBalance || 0,
                silverBalance: user.silverBalance || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/orders
// @desc    Get all orders for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, metalType } = req.query;

        // Build query
        let query = { userId: req.user._id };

        if (status) {
            query.status = status;
        }

        if (metalType) {
            query.metalType = metalType;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Make sure user owns this order
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/orders/manual
// @desc    Create a manual buy order (UPI/Bank Transfer)
// @access  Private
router.post('/manual', protect, async (req, res) => {
    try {
        const { metalType, amountPaid, gramsCredited, ratePerGram, transactionId, chitFundPlanId, chitFundMonth } = req.body;

        if (!metalType || !amountPaid || !gramsCredited || !ratePerGram || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // ── Prevent duplicate payment for same chit fund plan in same calendar month ──
        if (chitFundPlanId && chitFundMonth) {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            const existing = await Order.findOne({
                userId: req.user._id,
                chitFundPlanId,
                chitFundMonth,
                status: { $in: ['Pending', 'Success'] },
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Payment for Month ${chitFundMonth} already ${existing.status === 'Success' ? 'approved' : 'submitted (pending verification)'}. Only one payment per month is allowed.`,
                    alreadyPaid: true
                });
            }
        }

        // Generate Order ID
        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const order = await Order.create({
            userId: req.user._id,
            metalType,
            metalName: metalType === 'gold' ? 'Gold 24K' : 'Silver 99.9%',
            orderId,
            paymentId: transactionId,
            amountPaid,
            ratePerGram,
            gramsCredited,
            status: 'Pending',
            chitFundPlanId: chitFundPlanId || null,
            chitFundMonth: chitFundMonth || null
        });

        res.status(201).json({
            success: true,
            data: order,
            message: 'Order placed successfully! Waiting for verification.'
        });
    } catch (error) {
        console.error('Manual order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating order',
            error: error.message
        });
    }
});

// @route   POST /api/orders/admin/:id/approve
// @desc    Admin: Approve an order and credit grams to user's balance
// @access  Private (Admin)
router.post('/admin/:id/approve', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status === 'Success') {
            return res.status(400).json({ success: false, message: 'Order already approved' });
        }

        // Mark order as successful
        order.status = 'Success';
        await order.save();

        // ── Credit grams to user balance atomically (bypasses pre-save hooks) ──
        const balanceField = order.metalType === 'gold' ? 'goldBalance' : 'silverBalance';
        const updatedUser = await User.findByIdAndUpdate(
            order.userId,
            { $inc: { [balanceField]: order.gramsCredited } },
            { new: true, select: 'name email goldBalance silverBalance' }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log(`✅ Balance updated: ${updatedUser.name} → ${balanceField} += ${order.gramsCredited} → total: ${updatedUser[balanceField]}`);

        // ── If linked to a ChitFund plan, mark that month as paid ──────────────
        if (order.chitFundPlanId && order.chitFundMonth) {
            try {
                const plan = await ChitFund.findById(order.chitFundPlanId);
                if (plan) {
                    const paymentRecord = plan.payments.find(p => p.month === order.chitFundMonth);
                    if (paymentRecord && paymentRecord.status !== 'paid') {
                        paymentRecord.status = 'paid';
                        paymentRecord.paidDate = new Date();
                        paymentRecord.upiTransactionId = order.paymentId || order.orderId;
                        plan.paidMonths = plan.payments.filter(p => p.status === 'paid').length;

                        const nextPmt = plan.payments.find(p => p.status !== 'paid');
                        plan.nextDueDate = nextPmt ? nextPmt.dueDate : null;
                        plan.status = plan.paidMonths >= plan.totalMonths ? 'completed' : 'active';

                        await plan.save();
                        console.log(`✅ ChitFund plan ${plan._id} month ${order.chitFundMonth} marked paid`);
                    }
                }
            } catch (planErr) {
                console.error('ChitFund plan update error (non-fatal):', planErr.message);
            }
        }

        // ── Send payment bill email ─────────────────────────────────────────────
        if (updatedUser?.email) {
            sendPaymentBillEmail({
                toEmail: updatedUser.email,
                customerName: updatedUser.name || 'Valued Customer',
                order: order.toObject ? order.toObject() : order,
            }).catch(err => console.error('Bill email error (non-fatal):', err.message));
        }

        res.json({
            success: true,
            message: `Order approved. ${order.gramsCredited}g of ${order.metalType} credited to ${updatedUser.name}.`,
            data: {
                order,
                updatedBalance: {
                    goldBalance: updatedUser.goldBalance,
                    silverBalance: updatedUser.silverBalance
                }
            }
        });
    } catch (error) {
        console.error('Approve order error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/orders/admin/:id/reject
// @desc    Admin: Reject an order
// @access  Private (Admin)
router.post('/admin/:id/reject', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        order.status = 'Failed';
        await order.save();

        res.json({ success: true, message: 'Order rejected.', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/orders/admin/:id/credit-balance
// @desc    Admin: Manually credit grams to user for a specific order (for cases where status was changed directly in DB)
// @access  Private (Admin)
router.post('/admin/:id/credit-balance', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const user = await User.findById(order.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Credit grams to user balance
        if (order.metalType === 'gold') {
            user.goldBalance = (user.goldBalance || 0) + order.gramsCredited;
        } else {
            user.silverBalance = (user.silverBalance || 0) + order.gramsCredited;
        }

        // Ensure order is marked Success
        order.status = 'Success';
        await order.save();
        await user.save();

        res.json({
            success: true,
            message: `${order.gramsCredited}g of ${order.metalType} credited to ${user.name}.`,
            data: {
                order,
                updatedBalance: {
                    goldBalance: user.goldBalance,
                    silverBalance: user.silverBalance
                }
            }
        });
    } catch (error) {
        console.error('Credit balance error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/orders/admin/sync-balances
// @desc    Admin: Sync all user balances from all Success orders (fixes manual MongoDB edits)
// @access  Private (Admin)
router.post('/admin/sync-balances', protect, async (req, res) => {
    try {
        // Get all Success orders
        const successOrders = await Order.find({ status: 'Success' });

        // Group by userId
        const balanceMap = {};
        for (const order of successOrders) {
            const uid = order.userId.toString();
            if (!balanceMap[uid]) balanceMap[uid] = { goldBalance: 0, silverBalance: 0 };
            if (order.metalType === 'gold') {
                balanceMap[uid].goldBalance += order.gramsCredited || 0;
            } else {
                balanceMap[uid].silverBalance += order.gramsCredited || 0;
            }
        }

        // Update each user's balance
        let updatedCount = 0;
        for (const [userId, bal] of Object.entries(balanceMap)) {
            await User.findByIdAndUpdate(userId, {
                goldBalance: bal.goldBalance,
                silverBalance: bal.silverBalance
            });
            updatedCount++;
        }

        res.json({
            success: true,
            message: `Balances synced for ${updatedCount} users from ${successOrders.length} approved orders.`,
            data: balanceMap
        });
    } catch (error) {
        console.error('Sync balances error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/orders/admin/all
// @desc    Admin: Get all orders
// @access  Private (Admin)
router.get('/admin/all', protect, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const orders = await Order.find(filter)
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: orders, total: orders.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
