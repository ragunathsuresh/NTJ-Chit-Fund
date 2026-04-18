/**
 * DEV ADMIN TOOL — Run this script to manage chit fund requests during development
 * 
 * Usage:
 *   node scripts/adminTool.js list
 *   node scripts/adminTool.js approve <planId>
 *   node scripts/adminTool.js reject <planId>
 * 
 * First set your user token below (copy from app logs or login API response)
 */

const http = require('http');

// ─── CONFIG ────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000/api';
// Login first via POST /api/auth/login and paste the token here:
const ADMIN_TOKEN = 'PASTE_YOUR_JWT_TOKEN_HERE';

const UPI_ID = 'yourupi@upiid';       // Admin UPI for payments
const ADMIN_NAME = 'Admin';
// ───────────────────────────────────────────────────────────────

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api${path}`,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve(body); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    const [,, cmd, planId, ...rest] = process.argv;

    if (!cmd || cmd === 'list') {
        // ── LIST ALL REQUESTS ───────────────────────────────
        console.log('\n📋 All Chit Fund Requests:\n');
        const result = await request('GET', '/chitfund/admin/all');
        if (!result.success) { console.error('❌ Error:', result.message); return; }

        if (result.data.length === 0) {
            console.log('No requests found.');
            return;
        }

        result.data.forEach((p, i) => {
            const statusEmoji = {
                pending: '🟡', approved: '🟢', rejected: '🔴', active: '🔵', completed: '🟣'
            }[p.status] || '⚪';

            console.log(`${i + 1}. ${statusEmoji} ${p.status.toUpperCase()}`);
            console.log(`   ID      : ${p._id}`);
            console.log(`   User    : ${p.userId?.name || 'Unknown'} (${p.userId?.email || ''})`);
            console.log(`   Metal   : ${p.metalType}`);
            console.log(`   Monthly : ₹${p.monthlyAmount} × ${p.totalMonths} months = ₹${p.totalAmount}`);
            console.log(`   Submitted: ${new Date(p.createdAt).toLocaleString('en-IN')}`);
            if (p.adminNote) console.log(`   Note    : ${p.adminNote}`);
            console.log('');
        });

        console.log('─────────────────────────────────────────');
        console.log('To approve: node scripts/adminTool.js approve <ID>');
        console.log('To reject:  node scripts/adminTool.js reject <ID>');

    } else if (cmd === 'approve') {
        if (!planId) { console.error('❌ Usage: node scripts/adminTool.js approve <planId>'); return; }

        console.log(`\n✅ Approving plan: ${planId}\n`);
        const result = await request('POST', `/chitfund/admin/${planId}/approve`, {
            adminNote: 'Your chit fund request has been approved! Please pay monthly via UPI.',
            upiId: UPI_ID,
            adminName: ADMIN_NAME
        });

        if (result.success) {
            console.log('✅ APPROVED!');
            console.log(`   Plan    : ${result.data._id}`);
            console.log(`   Metal   : ${result.data.metalType}`);
            console.log(`   Months  : ${result.data.totalMonths}`);
            console.log(`   Amount  : ₹${result.data.monthlyAmount}/month`);
            console.log(`   UPI     : ${result.data.upiId}`);
            console.log(`   First due: ${new Date(result.data.payments[0]?.dueDate).toDateString()}`);
        } else {
            console.error('❌ Error:', result.message);
        }

    } else if (cmd === 'reject') {
        if (!planId) { console.error('❌ Usage: node scripts/adminTool.js reject <planId>'); return; }

        const note = rest.join(' ') || 'Request rejected during review.';
        console.log(`\n🚫 Rejecting plan: ${planId}\n`);
        const result = await request('POST', `/chitfund/admin/${planId}/reject`, { adminNote: note });

        if (result.success) {
            console.log('🚫 REJECTED');
            console.log(`   Note: ${result.data.adminNote}`);
        } else {
            console.error('❌ Error:', result.message);
        }

    } else if (cmd === 'orders') {
        // ── LIST ALL ORDERS ────────────────────────────────
        console.log('\n🧾 All Orders:\n');
        const result = await request('GET', '/orders/admin/all');
        if (!result.success) { console.error('❌ Error:', result.message); return; }

        if (result.data.length === 0) { console.log('No orders found.'); return; }

        result.data.forEach((o, i) => {
            const emoji = { Success: '✅', Pending: '⏳', Failed: '❌' }[o.status] || '⚪';
            console.log(`${i + 1}. ${emoji} ${o.status}`);
            console.log(`   ID      : ${o._id}`);
            console.log(`   User    : ${o.userId?.name} (${o.userId?.email})`);
            console.log(`   Metal   : ${o.metalType} — ${o.gramsCredited}g`);
            console.log(`   Amount  : ₹${o.amountPaid}`);
            console.log(`   Ref/UTR : ${o.paymentId || '—'}`);
            console.log(`   Date    : ${new Date(o.createdAt).toLocaleString('en-IN')}`);
            console.log('');
        });
        console.log('─────────────────────────────────────────');
        console.log('To approve order: node scripts/adminTool.js approve-order <orderId>');
        console.log('To reject order:  node scripts/adminTool.js reject-order <orderId>');

    } else if (cmd === 'approve-order') {
        if (!planId) { console.error('❌ Usage: node scripts/adminTool.js approve-order <orderId>'); return; }
        console.log(`\n✅ Approving order: ${planId}\n`);
        const result = await request('POST', `/orders/admin/${planId}/approve`);
        if (result.success) {
            console.log('✅ ORDER APPROVED & GRAMS CREDITED!');
            console.log(`   Metal   : ${result.data.order.metalType}`);
            console.log(`   Grams   : ${result.data.order.gramsCredited}g credited`);
            console.log(`   Gold Bal: ${result.data.updatedBalance.goldBalance}g`);
            console.log(`   Silv Bal: ${result.data.updatedBalance.silverBalance}g`);
        } else {
            console.error('❌ Error:', result.message);
        }

    } else if (cmd === 'reject-order') {
        if (!planId) { console.error('❌ Usage: node scripts/adminTool.js reject-order <orderId>'); return; }
        console.log(`\n🚫 Rejecting order: ${planId}\n`);
        const result = await request('POST', `/orders/admin/${planId}/reject`);
        if (result.success) { console.log('🚫 Order rejected.'); }
        else console.error('❌ Error:', result.message);

    } else if (cmd === 'login') {
        const [email, password] = rest;
        if (!email || !password) { console.error('Usage: node scripts/adminTool.js login email password'); return; }
        console.log(`\n🔑 Logging in as ${email}...\n`);
        const result = await request('POST', '/auth/login', { email, password });
        if (result.success) {
            console.log('✅ Token (paste into ADMIN_TOKEN):\n');
            console.log(result.data.token);
        } else {
            console.error('❌ Login failed:', result.message);
        }

    } else {
        console.log('\nChit Fund Commands:');
        console.log('  node scripts/adminTool.js list');
        console.log('  node scripts/adminTool.js approve <planId>');
        console.log('  node scripts/adminTool.js reject <planId>');
        console.log('\nOrder Commands:');
        console.log('  node scripts/adminTool.js orders');
        console.log('  node scripts/adminTool.js approve-order <orderId>  ← credits grams!');
        console.log('  node scripts/adminTool.js reject-order <orderId>');
        console.log('\nAuth:');
        console.log('  node scripts/adminTool.js login email password');
    }
}

main().catch(console.error);
