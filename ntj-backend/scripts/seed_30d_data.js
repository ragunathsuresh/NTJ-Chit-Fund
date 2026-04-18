const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const PriceHistory = require('../models/PriceHistory');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing history for gold to avoid duplication if running again
        await PriceHistory.deleteMany({ metalType: 'gold' });
        console.log('Cleared existing gold history.');

        const now = new Date();
        const history = [];

        // Base price around 7200 for 1g of 24k Gold
        let currentPrice = 7200;

        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add some random variation (-50 to +50 per day)
            const variation = (Math.random() - 0.5) * 100;
            currentPrice += variation;

            history.push({
                metalType: 'gold',
                price: Math.round(currentPrice),
                timestamp: date
            });
        }

        await PriceHistory.insertMany(history);
        console.log(`Successfully seeded ${history.length} gold price points!`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
