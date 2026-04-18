const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// Nodemailer transporter — Gmail SMTP
// Uses an App Password (2FA → Google Account → App Passwords)
// In dev mode (no password set) OTP is printed to console
// ─────────────────────────────────────────────────────────────
const isEmailConfigured = () => {
    const pass = process.env.EMAIL_APP_PASSWORD || '';
    // consider unconfigured only if it looks like a placeholder
    return (
        pass.length > 0 &&
        !pass.includes('your_gmail') &&
        !pass.includes('your_16_char') &&
        !pass.includes('app_password_here')
    );
};

const createTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM || 'ragusuresh291@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendOtpEmail = async (toEmail, otp, recipientName) => {
    const fromEmail = process.env.EMAIL_FROM || 'ragusuresh291@gmail.com';

    if (!isEmailConfigured()) {
        // Dev fallback: print OTP to terminal only — never shown in app
        console.log('\n################################################');
        console.log('#########  OTP EMAIL (DEVELOPMENT)  ############');
        console.log(`#  TO:   ${toEmail}`);
        console.log(`#  OTP:  ${otp}`);
        console.log('#  (Set EMAIL_APP_PASSWORD in .env to send real emails)');
        console.log('################################################\n');
        return { sent: false, otp };
    }

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"NTJ Jewellery" <${fromEmail}>`,
            to: toEmail,
            subject: 'NTJ Jewellery — Your OTP Verification Code',
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f1f8e9; padding: 20px;">
  <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: #2e7d32; padding: 28px 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px;">✦ NTJ JEWELLERY</h1>
      <p style="color: #a5d6a7; margin: 6px 0 0; font-size: 13px;">Chit Fund & Gold Investment App</p>
    </div>
    <div style="padding: 32px 24px; text-align: center;">
      <p style="color: #1b3223; font-size: 16px; margin: 0 0 8px;">Hi <strong>${recipientName || 'there'}</strong>,</p>
      <p style="color: #4caf50; font-size: 14px; margin: 0 0 24px;">Your verification OTP is:</p>
      <div style="background: #f1f8e9; border: 2px dashed #2e7d32; border-radius: 12px; padding: 20px; margin: 0 auto 24px; display: inline-block; min-width: 200px;">
        <span style="font-size: 40px; font-weight: bold; color: #2e7d32; letter-spacing: 10px;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 13px; margin: 0 0 8px;">⏱ Valid for <strong>10 minutes</strong></p>
      <p style="color: #999; font-size: 12px; margin: 0;">Do not share this OTP with anyone.<br>NTJ Jewellery will never ask for your OTP.</p>
    </div>
    <div style="background: #f9fbf9; padding: 16px 24px; text-align: center; border-top: 1px solid #e8f5e9;">
      <p style="color: #81c784; font-size: 11px; margin: 0;">© 2026 NTJ Jewellery. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
        });
        console.log(`✅ OTP email sent to ${toEmail}`);
        return { sent: true, otp };
    } catch (error) {
        // Email failed — print OTP to terminal as last resort (never shown in app)
        console.error('❌ Email send error:', error.message);
        console.log('\n################################################');
        console.log('####  EMAIL FAILED — OTP (check terminal)  #####');
        console.log(`#  TO:   ${toEmail}`);
        console.log(`#  OTP:  ${otp}`);
        console.log('#  Fix: Use a Gmail App Password (16-char code)');
        console.log('#  Google Account → Security → App Passwords');
        console.log('################################################\n');
        return { sent: false, otp };
    }
};

// ─────────────────────────────────────────────────────────────
// In-memory OTP stores (email-keyed now)
// ─────────────────────────────────────────────────────────────
const otpStore = new Map();      // email → { otp, userData, expiresAt }
const resetOtpStore = new Map(); // email → { otp, expiresAt }

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/send-otp
// @desc   Validate user details, send OTP to EMAIL
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    try {
        await body('name').trim().notEmpty().withMessage('Name is required').run(req);
        await body('email').isEmail().withMessage('Valid email is required').run(req);
        await body('phone').trim().notEmpty().withMessage('Phone is required').run(req);
        await body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, phone, password } = req.body;
        const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ success: false, message: 'Email address already registered.' });
        }
        const phoneExists = await User.findOne({ phone: normalizedPhone });
        if (phoneExists) {
            return res.status(400).json({ success: false, message: 'Phone number already registered.' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        // Store keyed by EMAIL (not phone)
        otpStore.set(email, { otp, userData: { name, email, phone: normalizedPhone, password }, expiresAt });

        // Send OTP via Email
        await sendOtpEmail(email, otp, name);

        const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

        res.json({
            success: true,
            message: `OTP sent to your email address. Valid for 10 minutes.`,
            email,
            maskedEmail,
            // devOtp intentionally NOT included — OTP is only sent via email
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/verify-otp
// @desc   Verify OTP and create user account
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        await body('email').isEmail().withMessage('Email is required').run(req);
        await body('otp').trim().notEmpty().withMessage('OTP is required').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, otp } = req.body;
        const stored = otpStore.get(email);

        if (!stored) {
            return res.status(400).json({ success: false, message: 'No OTP request found for this email. Please register again.' });
        }
        if (Date.now() > stored.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
        }
        if (stored.otp !== otp.trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        const { name, phone, password } = stored.userData;

        const userExists = await User.findOne({ $or: [{ email }, { phone }] });
        if (userExists) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, message: 'User already exists with this email or phone.' });
        }

        const user = await User.create({ name, email, phone, password });
        otpStore.delete(email);

        res.status(201).json({
            success: true,
            message: 'Email verified and account created successfully!',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                goldBalance: user.goldBalance,
                silverBalance: user.silverBalance,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/resend-otp
// @desc   Resend OTP (to email)
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const stored = otpStore.get(email);
        if (!stored) {
            return res.status(400).json({ success: false, message: 'No pending registration found. Please fill the registration form again.' });
        }

        const otp = generateOTP();
        stored.otp = otp;
        stored.expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(email, stored);

        await sendOtpEmail(email, otp, stored.userData?.name);

        res.json({ success: true, message: 'OTP resent to your email address.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/login
// @desc   Login user (email or phone + password)
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        await body('password').notEmpty().withMessage('Password is required').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, phone, password } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ success: false, message: 'Email or phone is required' });
        }

        const normalizedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone}`) : null;
        const query = email ? { email } : { phone: normalizedPhone };
        const user = await User.findOne(query).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                goldBalance: user.goldBalance,
                silverBalance: user.silverBalance,
                kycStatus: user.kycStatus,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  GET /api/auth/me
// @access Private
// ─────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    try {
        res.json({ success: true, data: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/forgot-password
// @desc   Send password reset OTP via EMAIL
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ success: false, message: 'Please provide your email or phone number' });
        }

        let query;
        if (email) {
            query = { email };
        } else {
            const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
            query = { phone: normalizedPhone };
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with this email or phone' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        // Store by email
        resetOtpStore.set(user.email, { otp, expiresAt, phone: user.phone });

        // Send OTP to user's registered email
        await sendOtpEmail(user.email, otp, user.name);

        const maskedEmail = user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

        res.json({
            success: true,
            message: 'Reset OTP sent to your registered email address.',
            email: user.email,
            maskedEmail,
            // devOtp intentionally NOT included — OTP is only sent via email
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// @route  POST /api/auth/reset-password
// @desc   Verify email OTP and update password
// @access Public
// ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    try {
        await body('email').isEmail().withMessage('Email is required').run(req);
        await body('otp').notEmpty().withMessage('OTP is required').run(req);
        await body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters').run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, otp, password } = req.body;
        const stored = resetOtpStore.get(email);

        if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = password;
        await user.save();

        resetOtpStore.delete(email);
        res.json({ success: true, message: 'Password reset successful. You can now login.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────
// DEV ONLY endpoints
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    router.get('/dev/list-users', async (req, res) => {
        try {
            const users = await User.find({}).select('name email phone createdAt').sort({ createdAt: -1 });
            res.json({ success: true, count: users.length, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    });

    router.delete('/dev/delete-user', async (req, res) => {
        try {
            const { email, phone } = req.body;
            if (!email && !phone) return res.status(400).json({ success: false, message: 'Provide email or phone' });
            const query = email ? { email } : { phone };
            const result = await User.findOneAndDelete(query);
            if (!result) return res.status(404).json({ success: false, message: 'No user found' });
            if (result.email) otpStore.delete(result.email);
            res.json({ success: true, message: `User deleted: ${result.name}` });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    });

    router.delete('/dev/clear-all-users', async (req, res) => {
        try {
            const result = await User.deleteMany({});
            otpStore.clear();
            resetOtpStore.clear();
            res.json({ success: true, message: `Deleted ${result.deletedCount} users.` });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    });
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  — return current user's fresh data (incl. balances)
// ─────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
