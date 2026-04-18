const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Alert = require('../models/Alert');

// @route   GET /api/alerts
// @desc    Get all alerts for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/alerts
// @desc    Create new price alert
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { metalType, label, type, targetPrice, marketPrice } = req.body;

        const alert = await Alert.create({
            userId: req.user._id,
            metalType,
            label,
            type,
            targetPrice,
            marketPrice,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/alerts/:id
// @desc    Update alert
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Make sure user owns this alert
        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this alert'
            });
        }

        const { targetPrice, type, triggered } = req.body;

        if (targetPrice !== undefined) alert.targetPrice = targetPrice;
        if (type) alert.type = type;
        if (triggered === false) {
            // Reset alert so it can fire again
            alert.triggered = false;
            alert.triggeredAt = null;
            alert.isActive = true;
        }

        await alert.save();

        res.json({
            success: true,
            message: 'Alert updated successfully',
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PATCH /api/alerts/:id/toggle
// @desc    Toggle alert active status
// @access  Private
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Make sure user owns this alert
        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        alert.isActive = !alert.isActive;
        await alert.save();

        res.json({
            success: true,
            message: `Alert ${alert.isActive ? 'activated' : 'deactivated'}`,
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PATCH /api/alerts/:id/trigger
// @desc    Mark alert as triggered (called after notification is fired from mobile)
// @access  Private
router.patch('/:id/trigger', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({ success: false, message: 'Alert not found' });
        }

        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        alert.triggered = true;
        alert.triggeredAt = new Date();
        alert.isActive = false; // Auto-disable after triggering
        await alert.save();

        res.json({
            success: true,
            message: 'Alert marked as triggered',
            data: alert
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/alerts/:id
// @desc    Delete alert
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Make sure user owns this alert
        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        await alert.deleteOne();

        res.json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
