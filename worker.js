import Queue from "bull";
import redisClient from './utils/redis';
import dbClient from './utils/db';
import { ObjectID } from 'mongodb';
import imageThumbnail from "image-thumbnail";
import fs from 'fs';

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job, done) => {
    if (!job.fileId) return done(new Error('Missing fileId'));

    if (!job.userId) return done(new Error('Missing userId'));

    const file = dbClient.db.collection('files').findOne({
        _id: new ObjectID(job.fileId),
        userId: new ObjectID(job.userId)
    });

    if (!file) return done(new Error('File not found'));

    const imageThumbnail100 = await imageThumbnail(file.localPath, { width: 100 });
    const imageThumbnail250 = await imageThumbnail(file.localPath, { width: 250 });
    const imageThumbnail500 = await imageThumbnail(file.localPath, { width: 500 });

    await fs.writeFileSync(`${file.localPath}_100` ,imageThumbnail100);
    await fs.writeFileSync(`${file.localPath}_250` ,imageThumbnail250);
    await fs.writeFileSync(`${file.localPath}_500` ,imageThumbnail500);

})

module.exports = fileQueue;
