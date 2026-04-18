const express = require('express');
const router = express.Router();
const Rate = require('../models/Rate');
const PriceHistory = require('../models/PriceHistory');
const { protect } = require('../middleware/auth');

// @route   GET /api/rates
// @desc    Get latest rates for all metals
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Fetch latest gold rate
        const goldRate = await Rate.findOne({ metalType: 'gold', isActive: true })
            .sort({ createdAt: -1 });

        // Fetch latest silver rate
        const silverRate = await Rate.findOne({ metalType: 'silver', isActive: true })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                gold: goldRate || null,
                silver: silverRate || null
            }
        });
    } catch (error) {
        console.error('Error fetching rates:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching rates'
        });
    }
});

// @route   POST /api/rates
// @desc    Add new rate (Admin use - also creates price history)
// @access  Public (for now, should be Admin)
router.post('/', async (req, res) => {
    try {
        const { metalType, purity, buyPrice, sellPrice } = req.body;

        const rate = await Rate.create({
            metalType,
            purity,
            buyPrice,
            sellPrice
        });

        // Also create price history entry
        await PriceHistory.create({
            metalType,
            price: sellPrice
        });

        res.status(201).json({
            success: true,
            data: rate
        });
    } catch (error) {
        console.error('Error adding rate:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding rate'
        });
    }
});

// @route   GET /api/rates/history/:metalType
// @desc    Get price history for specific metal
// @access  Private
router.get('/history/:metalType', protect, async (req, res) => {
    try {
        const { metalType } = req.params;
        const { period = '1d' } = req.query;

        // Calculate time range based on period
        const now = new Date();
        let startDate;

        switch (period) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        const history = await PriceHistory.find({
            metalType,
            timestamp: { $gte: startDate }
        })
            .sort({ timestamp: 1 })
            .select('price timestamp -_id');

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching price history'
        });
    }
});

// @route   GET /api/rates/statistics/:metalType
// @desc    Get statistics for specific metal
// @access  Private
router.get('/statistics/:metalType', protect, async (req, res) => {
    try {
        const { metalType } = req.params;
        const { period = '1d' } = req.query;

        // Calculate time range
        const now = new Date();
        let startDate;

        switch (period) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '1w':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '1m':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        // Get statistics using aggregation
        const stats = await PriceHistory.aggregate([
            {
                $match: {
                    metalType,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    high: { $max: '$price' },
                    low: { $min: '$price' },
                    average: { $avg: '$price' },
                    prices: { $push: '$price' }
                }
            }
        ]);

        // Get current price
        const currentRate = await Rate.findOne({ metalType, isActive: true })
            .sort({ createdAt: -1 });

        if (!currentRate || stats.length === 0) {
            return res.json({
                success: true,
                data: {
                    high: 0,
                    low: 0,
                    average: 0,
                    volatility: 0,
                    currentPrice: currentRate?.sellPrice || 0,
                    change: 0,
                    changePercent: 0
                }
            });
        }

        const statistics = stats[0];
        const currentPrice = currentRate.sellPrice;

        // Calculate volatility (standard deviation / mean)
        const prices = statistics.prices;
        const mean = statistics.average;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const volatility = (stdDev / mean) * 100;

        // Calculate change from first price in period
        const firstPrice = prices[0];
        const change = currentPrice - firstPrice;
        const changePercent = (change / firstPrice) * 100;

        res.json({
            success: true,
            data: {
                high: statistics.high,
                low: statistics.low,
                average: statistics.average,
                volatility: parseFloat(volatility.toFixed(2)),
                currentPrice,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(2))
            }
        });
    } catch (error) {
        console.error('Error calculating statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error calculating statistics'
        });
    }
});

module.exports = router;
