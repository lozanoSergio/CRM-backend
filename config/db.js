const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_URL}`;
        await mongoose.connect(dbUrl);
        console.log('CONNECTED TO DATABASE!');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

module.exports = connectDB;
