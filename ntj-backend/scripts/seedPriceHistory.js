// Script to seed price history data for testing
// Run with: node scripts/seedPriceHistory.js

require('dotenv').config();
const mongoose = require('mongoose');
const PriceHistory = require('../models/PriceHistory');
const Rate = require('../models/Rate');

mongoose.connect(process.env.MONGODB_URI);

const generateHistory = (basePrice, days, metalType) => {
    const history = [];
    const now = new Date();

    for (let i = days; i >= 0; i--) {
        const hoursInDay = 24;
        for (let hour = 0; hour < hoursInDay; hour++) {
            const timestamp = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000) - (hour * 60 * 60 * 1000));

            // Generate realistic price fluctuation
            const fluctuation = (Math.random() - 0.5) * (basePrice * 0.02); // +/- 2%
            const trend = ((days - i) / days) * (basePrice * 0.05); // Slight upward trend
            const price = basePrice + fluctuation + trend;

            history.push({
                metalType,
                price: parseFloat(price.toFixed(2)),
                timestamp
            });
        }
    }

    return history;
};

const seedData = async () => {
    try {
        console.log('🌱 Seeding price history...');

        // Clear existing history
        await PriceHistory.deleteMany({});
        console.log('✅ Cleared existing price history');

        // Generate 60 days of history for gold (base: 7200 INR per gram)
        const goldHistory = generateHistory(7200, 60, 'gold');
        await PriceHistory.insertMany(goldHistory);
        console.log(`✅ Added ${goldHistory.length} gold price entries`);

        // Generate 60 days of history for silver (base: 85 INR per gram)
        const silverHistory = generateHistory(85, 60, 'silver');
        await PriceHistory.insertMany(silverHistory);
        console.log(`✅ Added ${silverHistory.length} silver price entries`);

        // Update current rates
        const latestGoldPrice = goldHistory[goldHistory.length - 1].price;
        const latestSilverPrice = silverHistory[silverHistory.length - 1].price;

        await Rate.findOneAndUpdate(
            { metalType: 'gold' },
            {
                metalType: 'gold',
                purity: '24K • 99.9%',
                buyPrice: latestGoldPrice - 50,
                sellPrice: latestGoldPrice,
                isActive: true
            },
            { upsert: true }
        );

        await Rate.findOneAndUpdate(
            { metalType: 'silver' },
            {
                metalType: 'silver',
                purity: 'Fine Silver • 99.9%',
                buyPrice: latestSilverPrice - 2,
                sellPrice: latestSilverPrice,
                isActive: true
            },
            { upsert: true }
        );

        console.log('✅ Updated current rates');
        console.log('🎉 Seeding complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
