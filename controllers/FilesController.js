import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import fs from 'fs';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = new ObjectID(await redisClient.get(givenTok));
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await dbClient.db.collection('users').findOne({ _id: userId });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type
        || (type !== 'folder'
        && type !== 'file'
        && type !== 'image')) {
      return res.status(400).json({ error: 'Missing type' });
    }
    let parentObjectId = parentId;
    if (!parentId) {
      parentObjectId = 0;
    } else {
      parentObjectId = new ObjectID(parentId);
      const file = dbClient.db.collection('files').findOne({ _id: parentObjectId });
      if (!file) {
        return res.status(400).json({ error: 'Parent not found' });
      } if (file.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    const localPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    if (type === 'folder') {
    const folder = {
        userId,
        name,
        type,
        isPublic,
        parentId: parentObjectId,
        localPath,
      };
      await dbClient.db.collection('files').insertOne(folder);

      return res.status(201).json(folder);
    }
    const filePath = `${localPath}/${uuidv4()}`;
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    await dbClient.db.collection('files').insertOne({
      userId,
      name,
      type,
      isPublic,
      parentId: parentObjectId,
      localPath: filePath,
    });

    const contentType = mime.contentType(filePath);
    return res.status(201).setHeader('Content-Type', contentType).sendFile(filePath);
  }
}
module.exports = FilesController;
