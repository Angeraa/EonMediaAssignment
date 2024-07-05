import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function connect(dbName) {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log('Connected to the database');
        return client.db(dbName);
    } catch (error) {
        console.error('Could not connect to the database', error);
        return null;
    }
}

export default connect;