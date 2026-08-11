import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Test single host direct connection (no replicaSet option) to avoid topology discovery issues
const uriSingle = 'mongodb://billetterie49_db_user:Dm5kXOrVbK4ERpMe@ac-d6b6iih-shard-00-01.jy9clji.mongodb.net:27017/djua_energy?ssl=true&authSource=admin';
const uriSrv = 'mongodb+srv://billetterie49_db_user:Dm5kXOrVbK4ERpMe@cluster0.jy9clji.mongodb.net/djua_energy';

const testConnection = async (uri, name) => {
  console.log(`\nTesting connection to ${name}...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ Success for ${name}! Host: ${conn.connection.host}`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error(`❌ Failed for ${name}: ${error.message}`);
    return false;
  }
};

const run = async () => {
  await testConnection(uriSingle, 'Single Host URI (mongodb://...shard-00-01...)');
  await testConnection(uriSrv, 'SRV URI (mongodb+srv://)');
  process.exit(0);
};

run();
