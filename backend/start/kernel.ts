import { connectDatabase } from '../config/database.js'
await connectDatabase().catch((error) => console.error('[database]', error.message))
