const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Global Error Catchers to find out why it's crashing
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR (Uncaught Exception):', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger (DEV) ──────────────────────────────────────
app.use((req, res, next) => {
    const ts = new Date().toLocaleTimeString('en-IN');
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: '🚀 NTJ Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const alertRoutes = require('./routes/alerts');
const bankRoutes = require('./routes/banks');
const kycRoutes = require('./routes/kyc');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/rates', require('./routes/rates'));
app.use('/api/chitfund', require('./routes/chitfund'));
app.use('/api/upi-config', require('./routes/upiConfig'));
app.use('/api/notifications', require('./routes/notifications'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5001;
const os = require('os');
const getLocalIp = () => {
    // Priority 1: Check if PREFERRED_IP is set in .env
    if (process.env.PREFERRED_IP) return process.env.PREFERRED_IP;

    const nets = os.networkInterfaces();
    let fallbackIp = 'localhost';

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                // If we find an IP matching the 10.164 range (which Metro is using), prioritize it
                if (net.address.startsWith('10.164.')) return net.address;
                fallbackIp = net.address;
            }
        }
    }
    return fallbackIp;
};
const server = app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Network: http://${ip}:${PORT}`);
    console.log(`📍 Local:   http://localhost:${PORT}\n`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
    } else {
        console.error('❌ Server error:', err);
    }
});
