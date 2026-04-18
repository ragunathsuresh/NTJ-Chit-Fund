const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const Rate = require('./models/Rate');
const PriceHistory = require('./models/PriceHistory');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ntj-jewellery';

async function seedHistory() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        // Clear existing history if needed (optional)
        // await PriceHistory.deleteMany({});
        // await Rate.deleteMany({});

        const metals = [
            { type: 'gold', basePrice: 7200, volatility: 50 },
            { type: 'silver', basePrice: 82, volatility: 2 }
        ];

        const historyEntries = [];
        const latestRates = [];

        const now = new Date();
        
        // Generate 30 days of data (one point every 6 hours = 120 points per metal)
        for (const metal of metals) {
            let currentPrice = metal.basePrice;
            
            for (let i = 120; i >= 0; i--) {
                const timestamp = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);
                
                // Random walk
                const change = (Math.random() - 0.5) * metal.volatility;
                currentPrice += change;

                historyEntries.push({
                    metalType: metal.type,
                    price: parseFloat(currentPrice.toFixed(2)),
                    timestamp: timestamp
                });

                // If it's the last point, it's the current rate
                if (i === 0) {
                    latestRates.push({
                        metalType: metal.type,
                        purity: metal.type === 'gold' ? '24K' : '999',
                        buyPrice: parseFloat((currentPrice * 0.98).toFixed(2)), // 2% spread
                        sellPrice: parseFloat(currentPrice.toFixed(2)),
                        isActive: true
                    });
                }
            }
        }

        console.log(`Inserting ${historyEntries.length} history entries...`);
        await PriceHistory.insertMany(historyEntries);
        
        console.log(`Updating latest rates...`);
        for (const rate of latestRates) {
            await Rate.findOneAndUpdate(
                { metalType: rate.metalType },
                rate,
                { upsert: true, new: true }
            );
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedHistory();
