import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient().on('error', (err) => {
      console.log('redis Client Error', err);
    });
    this.getAsync = util.promisify(this.client.get).bind(this.client);
    this.setAsync = util.promisify(this.client.set).bind(this.client);
    this.delAsync = util.promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, delay) {
    await this.setAsync(key, value, 'EX', delay);
  }

  async del(key) {
    await this.delAsync(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
