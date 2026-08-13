import mongoose from 'mongoose';
import config from './env.config.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        console.log(` MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(` Connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;