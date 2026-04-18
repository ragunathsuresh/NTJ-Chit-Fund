const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Rate = require('../models/Rate');

// Load env vars (assumes script run from project root)
dotenv.config();

const seedRates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Check if rates exist
        const count = await Rate.countDocuments();
        if (count > 0) {
            console.log('Rates already exist. Skipping seed.');
            process.exit();
        }

        // Add Gold Rate
        await Rate.create({
            metalType: 'gold',
            purity: '24K • 99.9% Purity',
            buyPrice: 6450.00,
            sellPrice: 6400.00
        });
        console.log('Gold Rate Added');

        // Add Silver Rate
        await Rate.create({
            metalType: 'silver',
            purity: 'Fine Silver • 99.9%',
            buyPrice: 78.50,
            sellPrice: 75.00
        });
        console.log('Silver Rate Added');

        console.log('Seeding Complete');
        process.exit();
    } catch (error) {
        console.error('Error seeding rates:', error);
        process.exit(1);
    }
};

seedRates();
