import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const base64CodedString = req.get('Authorization').split(' ')[1];
    const [email, password] = Buffer.from(base64CodedString, 'base64').toString('utf-8').split(':');
    const hashdPwd = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email });
    if (!user || user.password !== hashdPwd) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    return res.status(200).json({ token });
  }

  static async getDisconnect(request, response) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      response.status(204).json({});
    } else {
      response.status(401).json({ error: 'Unauthorized' });
    }
  }
}
module.exports = AuthController;
