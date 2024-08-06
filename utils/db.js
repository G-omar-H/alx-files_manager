import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || '127.0.0.1';
    this.port = process.env.DB_PORT || 27017;
    this.dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${this.host}:${this.port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(this.dbName);
      })
      .catch((err) => {
        console.error('Connection to MongoDB failed', err);
      });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const count = await this.db.collection('users').countDocuments();
    return count;
  }

  async nbFiles() {
    const count = await this.db.collection('files').countDocuments();
    return count;
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
