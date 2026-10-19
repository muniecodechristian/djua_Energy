// Isolated manual browser fixture: never connects to the project's database.
import { MongoMemoryServer } from 'mongodb-memory-server';
const mongo = await MongoMemoryServer.create();
process.env.MONGO_URI = mongo.getUri();
process.env.NODE_ENV = 'test';
const { default: mongoose } = await import('mongoose');
const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.config.js');
const { default: User } = await import('../src/models/user.model.js');
const { default: Quote } = await import('../src/models/Quote.model.js');
const { default: Client } = await import('../src/models/SalesClient.model.js');
const { default: Notice } = await import('../src/models/InstallationNotice.model.js');
await connectDB();await Promise.all([Quote.init(),Client.init(),Notice.init()]);
const manager=await User.create({nom:'Fixture',prenom:'Shop',identifier:'browser-shop@test.local',password:'BrowserTest123!',role:'shop_manager'});
for(const [role,identifier] of [['commercial','browser-sales@test.local'],['technician','browser-tech@test.local'],['admin','browser-admin@test.local']])await User.create({nom:'Fixture',prenom:role,identifier,password:'BrowserTest123!',role,createdBy:manager._id});
const server=app.listen(5190,'127.0.0.1',()=>console.log('Isolated quotation test backend ready on 5190'));
async function stop(){await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();await mongo.stop();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
