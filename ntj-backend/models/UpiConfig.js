const mongoose = require('mongoose');

/**
 * UpiConfig Model — maps to the existing "upi_configs" collection
 * 
 * Schema matches what the Admin app already stores:
 *   upiId      : the UPI address (e.g. "rohitramesh545-1@oksbi")
 *   label      : friendly label set by admin (e.g. "SBI")
 *   isActive   : only ONE should be true at a time
 *   department : "gold" | "silver" (the department this UPI is for)
 */
const upiConfigSchema = new mongoose.Schema(
    {
        upiId: {
            type: String,
            required: [true, 'UPI ID is required'],
            trim: true,
        },
        label: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        department: {
            type: String,
            enum: ['gold', 'silver', 'both', ''],
            default: 'gold',
        },
    },
    {
        timestamps: true,
        collection: 'upi_configs', // ← explicitly use the existing collection name
    }
);

// Ensure only one active config at a time when activating
upiConfigSchema.pre('save', async function () {
    if (this.isModified('isActive') && this.isActive) {
        const Model = mongoose.model('UpiConfig');
        await Model.updateMany(
            { _id: { $ne: this._id } },
            { $set: { isActive: false } }
        );
    }
});

module.exports = mongoose.model('UpiConfig', upiConfigSchema);
