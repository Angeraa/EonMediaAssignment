import express from 'express';
import multer from 'multer';
import connect from './db.js';
import { GridFSBucket } from 'mongodb';

//import fs from 'fs';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload/:genre', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files.video || !req.files.thumbnail) {
            return res.status(400).json({ msg: 'Video or thumbnail not uploaded' });
        }

        const videoDb = await connect('videos');
        const bucket = new GridFSBucket(videoDb, { bucketName: 'videos' });

        const thumbDb = await connect('thumbnails');

        const videoStream = bucket.openUploadStream(req.files.video[0].originalname);
        videoStream.write(req.files.video[0].buffer);
        videoStream.end();

        const videoUploadPromise = new Promise((resolve, reject) => {
            videoStream.on('finish', resolve);
            videoStream.on('error', reject);
        })

        const videoFileInfo = await videoUploadPromise;

        const thumbnailStream = bucket.openUploadStream(req.files.thumbnail[0].originalname, {
            metadata: { videoId: videoFileInfo._id },
        });
        thumbnailStream.write(req.files.thumbnail[0].buffer);
        thumbnailStream.end();

        thumbnailStream.on('finish', () => {
            thumbDb.collection('ids').updateOne({ genre: req.params.genre }, {
                $push: { thumbnails: thumbnailFileInfo._id },
            }, {
                upsert: true,
            });
            res.status(201).json({
                video: req.files.video[0].originalname,
                thumbnail: req.files.thumbnail[0].originalname,
                videoId: videoFileInfo._id.toString(),
                thumbnailId: thumbnailFileInfo._id.toString()
            });
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ msg: 'Failed to upload files', error: error.message });
    }
});

router.get('/getVideo/:id', async (req, res) => {
    const db = await connect('videos');
    if (db == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const test = await db.collection('files').find({}).toArray();
    /* const bucket = new GridFSBucket(db, { bucketName: 'videos' });
    const cursor = bucket.find({ _id: req.params.id });
    const video = await cursor.toArray();
    if (video.length === 0) {
        res.status(404).json({ msg: 'Video not found' });
        return;
    }
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : video.length - 1;
        const chunksize = (end - start) + 1;
        const head = {
            'Content-Range': `bytes ${start}-${end}/${video.length}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
    } else {
        const head = {
            'Content-Length': video.length,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
    }
    const downloadStream = bucket.openDownloadStream(video._id, {
        start:start,
        end:end
    });
    downloadStream.pipe(res); */
    //for testing the route
    const path = './videos/vid1.mp4';
    const stat = fs.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log(range);
    if (range) {
        const parts = range.replace(/bytes=/, "").split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(path, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(path).pipe(res);
    }
});

router.get('/getThumbnails/:genre', async (req, res) => {
    const db = await connect('thumbnails');
    if (db == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const thumbnails = await db.collection('ids').find({ genre: req.params.genre }).toArray();
    res.status(200).json(thumbnails.thumbnails);
});

router.get('/getThumbnail/:id', async (req, res) => {
    const db = await connect('videos');
    if (db == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });
    const cursor = bucket.find({ _id: req.params.id });
    const thumbnail = await cursor.toArray();
    if (thumbnail.length === 0) {
        res.status(404).json({ msg: 'Thumbnail not found' });
        return;
    }
    res.status(200).json({videoId: thumbnail[0].metadata.videoId.toString()});
    const downloadStream = bucket.openDownloadStream(thumbnail[0]._id);
    downloadStream.pipe(res);
});

export default router;