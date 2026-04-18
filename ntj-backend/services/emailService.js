/**
 * NTJ Email Service
 * Handles all transactional emails: OTP, payment bills, chit fund approvals
 * Sender: ragusuresh291@gmail.com (configured via EMAIL_FROM + EMAIL_APP_PASSWORD in .env)
 */

const nodemailer = require('nodemailer');

// ─── Transporter factory ───────────────────────────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_FROM || 'ragusuresh291@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const isEmailConfigured = () => {
    const pass = process.env.EMAIL_APP_PASSWORD || '';
    return (
        pass.length > 8 &&
        !pass.includes('your_gmail') &&
        !pass.includes('your_16_char') &&
        !pass.includes('app_password_here')
    );
};

/**
 * Core send function — logs to console if email not configured or fails
 */
const sendEmail = async ({ to, subject, html }) => {
    const fromEmail = process.env.EMAIL_FROM || 'ragusuresh291@gmail.com';
    const configured = isEmailConfigured();

    console.log(`\n📧 [EmailService] Sending email:`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   From: ${fromEmail}`);
    console.log(`   Configured: ${configured}`);

    if (!configured) {
        console.log('   ⚠️  EMAIL_APP_PASSWORD not set or is placeholder — email skipped.');
        return { sent: false };
    }

    try {
        const transporter = createTransporter();
        await transporter.sendMail({ from: `"NTJ Jewellery" <${fromEmail}>`, to, subject, html });
        console.log(`   ✅ Email sent successfully to ${to}`);
        return { sent: true };
    } catch (error) {
        console.error(`   ❌ Email FAILED to ${to}:`, error.message);
        console.error(`   Error code: ${error.code || 'N/A'}`);
        return { sent: false, error: error.message };
    }
};

// ─── HTML email wrapper (shared header/footer) ─────────────────────────────────
const wrapHtml = (bodyContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f8e9;">
  <div style="max-width:560px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2e7d32,#1b5e20);padding:28px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:3px;">✦ NTJ JEWELLERY</h1>
      <p style="color:#a5d6a7;margin:6px 0 0;font-size:12px;letter-spacing:1px;">SRI LAKSHMI VINAYAKA GOLDEN JEWELLERY</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 28px;">
      ${bodyContent}
    </div>
    <!-- Footer -->
    <div style="background:#f9fbf9;padding:16px 24px;text-align:center;border-top:1px solid #e8f5e9;">
      <p style="color:#81c784;font-size:11px;margin:0;">© 2026 NTJ Jewellery. All rights reserved.</p>
      <p style="color:#aaa;font-size:10px;margin:4px 0 0;">This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

// ─── 1. PAYMENT BILL EMAIL ────────────────────────────────────────────────────
/**
 * Send a purchase confirmation bill email after payment is approved/verified.
 * @param {Object} params
 * @param {string} params.toEmail        - Customer email
 * @param {string} params.customerName   - Customer full name
 * @param {Object} params.order          - Order details from DB
 */
const sendPaymentBillEmail = async ({ toEmail, customerName, order }) => {
    const invoiceNo = `NTJ-${order._id?.toString().slice(-8).toUpperCase() || Date.now().toString().slice(-8)}`;
    const purchaseDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const metalLabel = order.metalType === 'gold' ? '🥇 Gold (24K)' : '🥈 Silver (Fine)';
    const amountFormatted = `₹${parseFloat(order.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const gramsFormatted = parseFloat(order.gramsCredited || 0).toFixed(4);
    const rateFormatted = `₹${parseFloat(order.ratePerGram || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/g`;

    const html = wrapHtml(`
      <p style="color:#1b3223;font-size:16px;margin:0 0 4px;">Dear <strong>${customerName}</strong>,</p>
      <p style="color:#4caf50;font-size:14px;margin:0 0 24px;">Your purchase has been confirmed. Here is your invoice:</p>

      <!-- Invoice Header -->
      <div style="background:#f1f8e9;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;">
        <div>
          <p style="margin:0;color:#666;font-size:11px;letter-spacing:1px;font-weight:bold;">INVOICE NUMBER</p>
          <p style="margin:4px 0 0;color:#1b3223;font-size:16px;font-weight:bold;">${invoiceNo}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;color:#666;font-size:11px;letter-spacing:1px;font-weight:bold;">DATE</p>
          <p style="margin:4px 0 0;color:#1b3223;font-size:14px;font-weight:bold;">${purchaseDate}</p>
        </div>
      </div>

      <!-- Bill Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
        <tr style="background:#2e7d32;">
          <th style="padding:10px 14px;text-align:left;color:#fff;font-size:12px;font-weight:bold;border-radius:8px 0 0 0;">ITEM</th>
          <th style="padding:10px 14px;text-align:center;color:#fff;font-size:12px;font-weight:bold;">QTY (grams)</th>
          <th style="padding:10px 14px;text-align:center;color:#fff;font-size:12px;font-weight:bold;">RATE</th>
          <th style="padding:10px 14px;text-align:right;color:#fff;font-size:12px;font-weight:bold;border-radius:0 8px 0 0;">AMOUNT</th>
        </tr>
        <tr style="background:#fafafa;">
          <td style="padding:12px 14px;color:#1b3223;font-size:14px;font-weight:bold;border-bottom:1px solid #e8f5e9;">${metalLabel}</td>
          <td style="padding:12px 14px;text-align:center;color:#1b3223;font-size:14px;border-bottom:1px solid #e8f5e9;">${gramsFormatted}g</td>
          <td style="padding:12px 14px;text-align:center;color:#1b3223;font-size:14px;border-bottom:1px solid #e8f5e9;">${rateFormatted}</td>
          <td style="padding:12px 14px;text-align:right;color:#2e7d32;font-size:14px;font-weight:bold;border-bottom:1px solid #e8f5e9;">${amountFormatted}</td>
        </tr>
      </table>

      <!-- Total -->
      <div style="background:#2e7d32;border-radius:10px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <span style="color:#fff;font-size:16px;font-weight:bold;letter-spacing:1px;">TOTAL PAID</span>
        <span style="color:#fff;font-size:22px;font-weight:bold;">${amountFormatted}</span>
      </div>

      <!-- Payment Details -->
      <div style="border:1px solid #e8f5e9;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
        <p style="color:#888;font-size:11px;font-weight:bold;letter-spacing:1px;margin:0 0 10px;">PAYMENT DETAILS</p>
        <table width="100%" cellpadding="4">
          <tr><td style="color:#666;font-size:13px;width:40%;">Payment Method</td><td style="color:#1b3223;font-size:13px;font-weight:600;">UPI</td></tr>
          ${order.paymentId ? `<tr><td style="color:#666;font-size:13px;">Payment ID</td><td style="color:#1b3223;font-size:13px;font-weight:600;">${order.paymentId}</td></tr>` : ''}
          <tr><td style="color:#666;font-size:13px;">Status</td><td style="color:#2e7d32;font-size:13px;font-weight:bold;">✓ CONFIRMED</td></tr>
        </table>
      </div>

      <p style="color:#81c784;font-size:13px;text-align:center;margin:0;">Thank you for investing with NTJ Jewellery! 🙏</p>
    `);

    return sendEmail({
        to: toEmail,
        subject: `✅ NTJ Payment Confirmed — Invoice ${invoiceNo}`,
        html
    });
};

// ─── 2. CHIT FUND APPROVAL EMAIL ──────────────────────────────────────────────
/**
 * Send an approval notification email when admin approves a chit fund request.
 * @param {Object} params
 * @param {string} params.toEmail        - Customer email
 * @param {string} params.customerName   - Customer full name
 * @param {Object} params.plan           - ChitFund plan details from DB
 */
const sendChitFundApprovalEmail = async ({ toEmail, customerName, plan }) => {
    const approvalDate = new Date(plan.approvedAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const metalLabel = plan.metalType === 'gold' ? '🥇 Gold' : '🥈 Silver';
    const monthlyFormatted = `₹${parseFloat(plan.monthlyAmount || 0).toLocaleString('en-IN')}`;
    const totalFormatted = `₹${parseFloat(plan.totalAmount || 0).toLocaleString('en-IN')}`;
    const firstDueDate = plan.payments?.[0]?.dueDate
        ? new Date(plan.payments[0].dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'As scheduled';

    const html = wrapHtml(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#e8f5e9;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;margin-bottom:12px;">✅</div>
        <h2 style="color:#2e7d32;margin:0;font-size:22px;">Request Approved!</h2>
        <p style="color:#666;font-size:14px;margin:6px 0 0;">Your Chit Fund plan has been approved by NTJ Admin</p>
      </div>

      <p style="color:#1b3223;font-size:15px;margin:0 0 20px;">Dear <strong>${customerName}</strong>,</p>
      <p style="color:#555;font-size:14px;margin:0 0 24px;">
        We are pleased to inform you that your Chit Fund request <strong>"${plan.requestName}"</strong> 
        has been <span style="color:#2e7d32;font-weight:bold;">approved</span> on ${approvalDate}.
        Your payment schedule has been generated.
      </p>

      <!-- Plan Details -->
      <div style="background:#f1f8e9;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#2e7d32;font-size:12px;font-weight:bold;letter-spacing:1px;margin:0 0 14px;">PLAN DETAILS</p>
        <table width="100%" cellpadding="6">
          <tr>
            <td style="color:#666;font-size:13px;width:50%;">Plan Name</td>
            <td style="color:#1b3223;font-size:13px;font-weight:bold;">${plan.requestName}</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;">Metal Type</td>
            <td style="color:#1b3223;font-size:13px;font-weight:bold;">${metalLabel}</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;">Duration</td>
            <td style="color:#1b3223;font-size:13px;font-weight:bold;">${plan.totalMonths} Months</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;">Monthly Amount</td>
            <td style="color:#1b3223;font-size:13px;font-weight:bold;">${monthlyFormatted}</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;">Total Amount</td>
            <td style="color:#2e7d32;font-size:15px;font-weight:bold;">${totalFormatted}</td>
          </tr>
          <tr>
            <td style="color:#666;font-size:13px;">First Payment Due</td>
            <td style="color:#e65100;font-size:13px;font-weight:bold;">${firstDueDate}</td>
          </tr>
        </table>
      </div>

      ${plan.upiId ? `
      <!-- UPI Payment Info -->
      <div style="border:2px dashed #a5d6a7;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <p style="color:#666;font-size:11px;font-weight:bold;letter-spacing:1px;margin:0 0 8px;">PAY YOUR MONTHLY INSTALLMENT TO</p>
        <p style="color:#2e7d32;font-size:20px;font-weight:bold;margin:0;">${plan.upiId}</p>
        <p style="color:#888;font-size:12px;margin:6px 0 0;">Please add your Plan Name in UPI remarks while paying</p>
      </div>
      ` : ''}

      ${plan.adminNote ? `<div style="background:#fff8e1;border-left:4px solid #ffc107;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;"><p style="color:#795548;font-size:13px;margin:0;"><strong>Admin Note:</strong> ${plan.adminNote}</p></div>` : ''}

      <p style="color:#81c784;font-size:13px;text-align:center;margin:0;">
        Please make payments on time to keep your plan active. Thank you! 🙏
      </p>
    `);

    return sendEmail({
        to: toEmail,
        subject: `✅ NTJ Chit Fund Approved — "${plan.requestName}"`,
        html
    });
};

// ─── 3. CHIT FUND REJECTION EMAIL ─────────────────────────────────────────────
/**
 * Send a rejection notification email.
 */
const sendChitFundRejectionEmail = async ({ toEmail, customerName, plan }) => {
    const html = wrapHtml(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fde8e8;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;margin-bottom:12px;">❌</div>
        <h2 style="color:#c62828;margin:0;font-size:22px;">Request Not Approved</h2>
      </div>

      <p style="color:#1b3223;font-size:15px;margin:0 0 16px;">Dear <strong>${customerName}</strong>,</p>
      <p style="color:#555;font-size:14px;margin:0 0 20px;">
        We regret to inform you that your Chit Fund request <strong>"${plan.requestName}"</strong> 
        could not be approved at this time.
      </p>

      ${plan.adminNote ? `
      <div style="background:#fff8e1;border-left:4px solid #ffc107;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;">
        <p style="color:#795548;font-size:13px;margin:0;"><strong>Reason:</strong> ${plan.adminNote}</p>
      </div>
      ` : ''}

      <p style="color:#555;font-size:14px;margin:0 0 20px;">
        You are welcome to submit a new request. If you have any questions, please contact us via the Help & Support section in the app.
      </p>
      <p style="color:#81c784;font-size:13px;text-align:center;margin:0;">Thank you for your interest in NTJ Jewellery. 🙏</p>
    `);

    return sendEmail({
        to: toEmail,
        subject: `NTJ Chit Fund — Request Update for "${plan.requestName}"`,
        html
    });
};

module.exports = {
    sendEmail,
    sendPaymentBillEmail,
    sendChitFundApprovalEmail,
    sendChitFundRejectionEmail,
};
