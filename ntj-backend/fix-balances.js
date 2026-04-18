/**
 * One-time fix script: recalculate goldBalance/silverBalance for all users
 * based on their approved (Success) orders.
 * 
 * Run: node fix-balances.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String, email: String, phone: String, password: String,
    goldBalance: { type: Number, default: 0 },
    silverBalance: { type: Number, default: 0 },
    kycStatus: String, isActive: Boolean
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    metalType: String,
    gramsCredited: Number,
    status: String,
    amountPaid: Number,
    orderId: String,
    metalName: String,
    ratePerGram: Number,
    paymentId: String,
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

async function fixBalances() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    // Get all approved orders
    const successOrders = await Order.find({ status: 'Success' });
    console.log(`Found ${successOrders.length} approved orders`);

    // Group by userId
    const balanceMap = {};
    for (const order of successOrders) {
        const uid = order.userId.toString();
        if (!balanceMap[uid]) balanceMap[uid] = { goldBalance: 0, silverBalance: 0 };
        if (order.metalType === 'gold') balanceMap[uid].goldBalance += order.gramsCredited;
        else balanceMap[uid].silverBalance += order.gramsCredited;
    }

    // Update each user
    for (const [userId, balances] of Object.entries(balanceMap)) {
        const user = await User.findByIdAndUpdate(userId,
            { $set: { goldBalance: balances.goldBalance, silverBalance: balances.silverBalance } },
            { new: true }
        );
        if (user) {
            console.log(`✅ ${user.name} (${user.email})`);
            console.log(`   Gold: ${balances.goldBalance.toFixed(6)}g`);
            console.log(`   Silver: ${balances.silverBalance.toFixed(6)}g`);
        }
    }

    console.log('\n✅ All balances recalculated from approved orders.');
    await mongoose.disconnect();
    process.exit(0);
}

fixBalances().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
