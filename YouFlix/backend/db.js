import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

async function connect() {
    try {
        await client.connect();
        console.log('Connected to the database');
        return client.db('videos');
    } catch (error) {
        console.error('Could not connect to the database', error);
        return null;
    }
}

export default connect;