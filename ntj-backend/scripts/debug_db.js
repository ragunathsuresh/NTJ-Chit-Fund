const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({ phone: String, email: String, name: String });
const User = mongoose.model('User', userSchema);

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name email phone');
        console.log('\n--- ALL USERS IN DB ---');
        users.forEach(u => {
            console.log(`- ${u.name} | E: ${u.email} | P: ${u.phone}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
};

check();
