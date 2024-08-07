import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;
    const userId = await redisClient.get(givenTok);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    const parentObjectId = parentId ? new ObjectID(parentId) : 0;

    if (parentId) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentObjectId });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const localPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(localPath)) fs.mkdirSync(localPath, { recursive: true });

    const fileData = {
      userId: new ObjectID(userId),
      name,
      type,
      isPublic,
      parentId: parentObjectId,
    };

    if (type === 'folder') {
      const newFolder = await dbClient.db.collection('files').insertOne(fileData);
      return res.status(201).json({ id: newFolder.insertedId, ...fileData });
    }

    const filePath = `${localPath}/${uuidv4()}`;
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    const newFile = await dbClient.db.collection('files').insertOne({ ...fileData, localPath: filePath });

    return res.status(201).json({ id: newFile.insertedId, ...fileData });
  }

  static async getShow(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = await redisClient.get(givenTok);
    console.log(userId);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const givenId = req.params.id;

    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectID(givenId), userId: new ObjectID(userId) });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.json(file);
  }

  static async getIndex(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = await redisClient.get(givenTok);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { parentId, page = 0 } = req.params;

    const parentObejctId = parentId ? new ObjectID(parentId) : 0;

    const pageNumber = parseInt(page, 10);

    const file = await dbClient.db.collection('files').findOne({ parentId: parentObejctId });
    if (!file) return res.json([]);

    const content = await dbClient.db.collection('files').aggregate([
      { $match: { parentId: parentObejctId } },
      { $skip: pageNumber * 20 },
      { $limit: 20 },
    ]).toArray();
    return res.json(content);
  }

  static async putPublish(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = await redisClient.get(givenTok);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const givenId = req.params.id;

    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectID(givenId),
      userId: new ObjectID(userId),
    });
    if (!file) return res.status(404).json({ error: 'Not found' });

    const updatedFile = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectID(givenId) },
      { $set: { isPublic: true } },
      { returnDocument: 'after', returnoriginal: 'false' },
    );

    return res.status(200).json(updatedFile.value);
  }

  static async putUnpublish(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = await redisClient.get(givenTok);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const givenId = req.params.id;

    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectID(givenId),
      userId: new ObjectID(userId),
    });
    if (!file) return res.status(404).json({ error: 'Not found' });

    const updatedFile = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectID(givenId) },
      { $set: { isPublic: false } },
      { returnDocument: 'after', returnoriginal: 'false' },
    );

    return res.status(200).json(updatedFile.value);
  }
}
module.exports = FilesController;
