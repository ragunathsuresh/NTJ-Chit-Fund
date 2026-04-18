const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/kyc/upload
// @desc    Upload KYC documents (simplified - in production use file upload middleware)
// @access  Private
router.post('/upload', protect, async (req, res) => {
    try {
        const { aadhaar, pan } = req.body;

        if (!aadhaar || !pan) {
            return res.status(400).json({
                success: false,
                message: 'Both Aadhaar and PAN documents are required'
            });
        }

        const user = await User.findById(req.user._id);

        // Update KYC documents
        user.kycDocuments = {
            aadhaar,
            pan
        };
        user.kycStatus = 'pending'; // Set to pending for review

        await user.save();

        res.json({
            success: true,
            message: 'KYC documents uploaded successfully. Verification in progress.',
            data: {
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/kyc/status
// @desc    Get KYC status
// @access  Private
router.get('/status', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                kycStatus: req.user.kycStatus,
                kycDocuments: req.user.kycDocuments
            }
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
