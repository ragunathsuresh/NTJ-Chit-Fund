const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({ phone: { type: String, unique: true }, email: String, name: String });
const User = mongoose.model('User', userSchema);

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log(`\n--- FIXING ${users.length} USERS ---`);
        for (const u of users) {
             if (u.phone && u.phone.length === 10 && !u.phone.startsWith('+')) {
                 const newPhone = `+91${u.phone}`;
                 console.log(`Fixing ${u.name}: ${u.phone} -> ${newPhone}`);
                 try {
                     u.phone = newPhone;
                     await u.save();
                 } catch (e) {
                     console.error(`ERROR updated ${u.name}: ${e.message}`);
                 }
             } else {
                 console.log(`Skipping ${u.name}: ${u.phone} (already formatted)`);
             }
        }
        await mongoose.disconnect();
        console.log('\n--- DONE ---');
    } catch (e) {
        console.error(e);
    }
};

fix();
