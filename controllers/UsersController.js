import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      if (await dbClient.db.collection('users').findOne({ email })) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const hashdPwd = sha1(password);
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashdPwd });
      return res.status(201).json({
        id: result.insertedId,
        email,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;
    const userId = new ObjectID(await redisClient.get(givenTok));
    if (userId) {
      const user = await dbClient.db.collection('users').findOne({ _id: userId });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      return res.json({
        id: userId,
        email: user.email,
      });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
module.exports = UsersController;
