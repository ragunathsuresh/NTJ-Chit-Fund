const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of default 30s
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (error.message.includes('querySrv ETIMEOUT')) {
            console.error('💡 TIP: This is a DNS issue. Try switching your DNS to 8.8.8.8 or check your internet connection.');
        }
        // Don't exit immediately in dev, let the developer see the error
        // process.exit(1); 
    }
};

module.exports = connectDB;
