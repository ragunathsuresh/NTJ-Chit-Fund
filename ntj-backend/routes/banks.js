const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const BankAccount = require('../models/BankAccount');

// @route   GET /api/banks
// @desc    Get all bank accounts for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const accounts = await BankAccount.find({ userId: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });

        res.json({
            success: true,
            count: accounts.length,
            data: accounts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   POST /api/banks
// @desc    Add new bank account
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { bankName, accountNumber, ifscCode, accountHolder } = req.body;

        if (!bankName || !accountNumber || !ifscCode || !accountHolder) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if this is user's first account
        const existingAccounts = await BankAccount.find({ userId: req.user._id });
        const isPrimary = existingAccounts.length === 0;

        const account = await BankAccount.create({
            userId: req.user._id,
            bankName,
            accountNumber,
            ifscCode,
            accountHolder,
            isPrimary
        });

        res.status(201).json({
            success: true,
            message: 'Bank account added successfully',
            data: account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PATCH /api/banks/:id/primary
// @desc    Set bank account as primary
// @access  Private
router.patch('/:id/primary', protect, async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Make sure user owns this account
        if (account.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Set this account as primary (pre-save hook will handle unsetting others)
        account.isPrimary = true;
        await account.save();

        res.json({
            success: true,
            message: 'Primary account updated',
            data: account
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   DELETE /api/banks/:id
// @desc    Delete bank account
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Bank account not found'
            });
        }

        // Make sure user owns this account
        if (account.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Don't allow deleting primary account if other accounts exist
        if (account.isPrimary) {
            const otherAccounts = await BankAccount.countDocuments({
                userId: req.user._id,
                _id: { $ne: account._id }
            });

            if (otherAccounts > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete primary account. Set another account as primary first.'
                });
            }
        }

        await account.deleteOne();

        res.json({
            success: true,
            message: 'Bank account deleted successfully'
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
