require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB.\n');

    // Find ALL orders (check all statuses)
    const allOrders = await Order.find({});
    console.log('All orders:');
    allOrders.forEach(o => {
        console.log(`  ${o.orderId} | status: "${o.status}" | ${o.metalType} | ${o.gramsCredited}g | userId: ${o.userId}`);
    });

    // Find orders that are "success" or "Success"
    const successOrders = allOrders.filter(o =>
        o.status && o.status.toLowerCase() === 'success'
    );

    console.log(`\nFound ${successOrders.length} success orders to process.\n`);

    for (const order of successOrders) {
        const user = await User.findById(order.userId);
        if (!user) {
            console.log(`  ⚠️ User not found for order ${order.orderId}`);
            continue;
        }

        // Normalize status
        order.status = 'Success';
        await order.save();

        const oldGold = user.goldBalance || 0;
        const oldSilver = user.silverBalance || 0;

        if (order.metalType === 'gold') {
            user.goldBalance = oldGold + (order.gramsCredited || 0);
        } else {
            user.silverBalance = oldSilver + (order.gramsCredited || 0);
        }

        await user.save();
        console.log(`  ✅ ${user.name} | ${order.metalType} +${order.gramsCredited}g`);
        console.log(`     Before → Gold: ${oldGold}g, Silver: ${oldSilver}g`);
        console.log(`     After  → Gold: ${user.goldBalance}g, Silver: ${user.silverBalance}g\n`);
    }

    console.log('Done!');
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
