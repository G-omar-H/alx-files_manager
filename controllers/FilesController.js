import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import fileQueue from '../worker';

class FilesController {
  static async postUpload(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;
    const userId = await redisClient.get(givenTok);

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    const parentObjectId = parentId !== 0 ? new ObjectID(parentId) : 0;

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentObjectId });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileData = {
      userId: new ObjectID(userId),
      name,
      type,
      isPublic,
      parentId: parentObjectId,
    };

    if (type === 'folder') {
      const newFolder = await dbClient.db.collection('files').insertOne(fileData);
      return res.status(201).json({
        id: newFolder.insertedId,
        userId: fileData.userId,
        name: fileData.name,
        type: fileData.type,
        isPublic: fileData.isPublic,
        parentId,
      });
    }

    const localPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(localPath)) await fs.mkdirSync(localPath, { recursive: true });

    const filePath = path.join(localPath, uuidv4());
    await fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    
    const newFile = await dbClient.db.collection('files').insertOne({ ...fileData, localPath: filePath });
    
    if (newFile.type === 'image') {

      fileQueue.add({

        fileId: newFile.id,
        userId: newFile.userId
      });

    };
    
    return res.status(201).json({
      id: newFile.insertedId,
      userId: fileData.userId,
      name: fileData.name,
      type: fileData.type,
      isPublic: fileData.isPublic,
      parentId,
    });
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

  static async getFile(req, res) {
    const givenTok = `auth_${req.header('X-Token')}`;

    const userId = await redisClient.get(givenTok);

    const givenId = req.params.id;
    const size = req.params.size;
  
    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectID(givenId),
    });
    if (!file) return res.status(404).json({ error: 'Not found' });

    if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });
    if (!fs.existsSync(file.localPath)) return res.status(404).json({ error: 'Not found' });
    
    if (size) {

      const thumbnail = `${file.localPath}_${size}`;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

    };

    const contentType = mime.contentType(file.name);
    
    const filePath = size ? thumbnail : file.localPath;
    const data = fs.readFileSync(filePath);

    return res.setHeader('Content-Type', contentType).json(Buffer.from(data, 'base64').toString('utf-8').trim(''));
  }
}
module.exports = FilesController;
