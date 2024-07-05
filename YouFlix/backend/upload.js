import express from 'express';
import multer from 'multer';
import connect from './db.js';
import { GridFSBucket } from 'mongodb';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        if (!req.files.video || !req.files.thumbnail) {
            return res.status(400).json({ msg: 'Video or thumbnail not uploaded' });
        }

        const client = await connect();
        const bucket = new GridFSBucket(client, { bucketName: 'videos' });

        const thumbnailStream = bucket.openUploadStream(req.files.thumbnail[0].originalname);
        thumbnailStream.write(req.files.thumbnail[0].buffer);
        thumbnailStream.end();

        const thumbnailUploadPromise = new Promise((resolve, reject) => {
            thumbnailStream.on('finish', resolve);
            thumbnailStream.on('error', reject);
        });

        const thumbnailFileInfo = await thumbnailUploadPromise;

        const videoStream = bucket.openUploadStream(req.files.video[0].originalname, {
            metadata: { thumbnailId: thumbnailFileInfo._id.toString() },
        });
        videoStream.write(req.files.video[0].buffer);
        videoStream.end();

        videoStream.on('finish', () => {
            res.status(201).json({
                video: req.files.video[0].originalname,
                thumbnail: req.files.thumbnail[0].originalname,
                videoId: videoStream.id,
                thumbnailId: thumbnailFileInfo._id
            });
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ msg: 'Failed to upload files', error: error.message });
    }
});

router.get('/getVideo/:id', async (req, res) => {
    const db = await connect();
    if (db == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });
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
    downloadStream.pipe(res);
    //for testing the route
    /* const path = './videos/vid1.mp4';
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
    } */
});


export default router;