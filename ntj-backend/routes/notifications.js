const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, admin } = require('../middleware/auth');

// @desc    Get latest active notification
// @route   GET /api/notifications/latest
// @access  Public
router.get('/latest', async (req, res) => {
    try {
        const notification = await Notification.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error fetching notification',
            error: error.message
        });
    }
});

// @desc    Create or Update notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { message, isActive } = req.body;

        // Optionally deactivate all others if this is the new main one
        if (isActive !== false) {
            await Notification.updateMany({}, { isActive: false });
        }

        const notification = await Notification.create({
            message,
            isActive,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: notification
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error creating notification',
            error: error.message
        });
    }
});

// @desc    Get all notifications (Admin)
// @route   GET /api/notifications
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

// @desc    Update notification message/status (Admin)
// @route   PUT /api/notifications/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { message, isActive } = req.body;

        // If activating this one, deactivate all others first
        if (isActive === true) {
            await Notification.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
        }

        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { message, isActive },
            { new: true, runValidators: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

// @desc    Delete notification (Admin)
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

module.exports = router;
