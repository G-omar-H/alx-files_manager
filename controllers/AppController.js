import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req, res) {
    const checkRedis = await redisClient.isAlive();
    const checkDb = await dbClient.isAlive();
    res.status(200).json({ redis: checkRedis, db: checkDb });
  }

  static async getStats(req, res) {
    const usersNum = await dbClient.nbUsers();
    const filesNum = await dbClient.nbFiles();
    res.status(200).json({ users: usersNum, files: filesNum });
  }
}
module.exports = AppController;
