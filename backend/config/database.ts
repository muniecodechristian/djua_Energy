import mongoose from 'mongoose'
export const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/djua_energy'
export async function connectDatabase() { if (mongoose.connection.readyState === 0) await mongoose.connect(mongoUri) }
export default { connectDatabase, mongoUri }
