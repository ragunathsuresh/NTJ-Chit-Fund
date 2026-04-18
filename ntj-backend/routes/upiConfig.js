const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const UpiConfig = require('../models/UpiConfig');

// ─────────────────────────────────────────────────────────────
// USER / MOBILE ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/upi-config/active
 * @desc    Get the currently active UPI config (mobile app uses this for payments)
 * @access  Private (authenticated users)
 */
router.get('/active', protect, async (req, res) => {
    try {
        // Get the active UPI from the existing upi_configs collection
        const config = await UpiConfig.findOne({ isActive: true })
            .select('upiId label department');

        if (!config) {
            // Fallback: return the most recently created config
            const fallback = await UpiConfig.findOne()
                .sort({ createdAt: -1 })
                .select('upiId label department');

            if (!fallback) {
                return res.status(404).json({
                    success: false,
                    message: 'No UPI configuration found. Please contact admin.',
                });
            }

            return res.json({ success: true, data: fallback, isFallback: true });
        }

        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Get active UPI config error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/upi-config
 * @desc    Admin: Get all UPI configs from upi_configs collection
 * @access  Private (Admin)
 */
router.get('/', protect, async (req, res) => {
    try {
        const configs = await UpiConfig.find().sort({ createdAt: -1 });
        res.json({ success: true, data: configs, total: configs.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route   POST /api/upi-config
 * @desc    Admin: Add a new UPI config
 * @access  Private (Admin)
 */
router.post('/', protect, async (req, res) => {
    try {
        const { upiId, label, department, isActive } = req.body;

        if (!upiId) {
            return res.status(400).json({ success: false, message: 'upiId is required' });
        }
        if (!upiId.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid UPI ID format. Must contain "@" (e.g. name@bank)',
            });
        }

        const config = new UpiConfig({
            upiId: upiId.trim(),
            label: (label || '').trim(),
            department: department || 'gold',
            isActive: isActive === true || isActive === 'true',
        });

        await config.save();

        res.status(201).json({ success: true, message: 'UPI config added', data: config });
    } catch (error) {
        console.error('Add UPI config error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route   PATCH /api/upi-config/:id/activate
 * @desc    Admin: Set a specific UPI config as active (deactivates all others)
 * @access  Private (Admin)
 */
router.patch('/:id/activate', protect, async (req, res) => {
    try {
        const config = await UpiConfig.findById(req.params.id);
        if (!config) {
            return res.status(404).json({ success: false, message: 'UPI config not found' });
        }

        config.isActive = true;
        await config.save(); // pre-save hook deactivates all others

        res.json({
            success: true,
            message: `UPI ID "${config.upiId}" is now the active payment account`,
            data: config,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route   PATCH /api/upi-config/:id
 * @desc    Admin: Update a UPI config
 * @access  Private (Admin)
 */
router.patch('/:id', protect, async (req, res) => {
    try {
        const { upiId, label, department } = req.body;
        const config = await UpiConfig.findById(req.params.id);
        if (!config) {
            return res.status(404).json({ success: false, message: 'UPI config not found' });
        }

        if (upiId) {
            if (!upiId.includes('@')) {
                return res.status(400).json({ success: false, message: 'Invalid UPI ID format' });
            }
            config.upiId = upiId.trim();
        }
        if (label !== undefined) config.label = label.trim();
        if (department !== undefined) config.department = department;

        await config.save();
        res.json({ success: true, message: 'UPI config updated', data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * @route   DELETE /api/upi-config/:id
 * @desc    Admin: Delete a UPI config (only inactive ones)
 * @access  Private (Admin)
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const config = await UpiConfig.findById(req.params.id);
        if (!config) {
            return res.status(404).json({ success: false, message: 'UPI config not found' });
        }
        if (config.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the active UPI config. Activate another one first.',
            });
        }
        await config.deleteOne();
        res.json({ success: true, message: 'UPI config deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
