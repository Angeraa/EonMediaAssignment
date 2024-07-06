import express from 'express';
import multer from 'multer';
import connect from './db.js';
import { GridFSBucket, ObjectId } from 'mongodb';
import path from 'path';

import fs from 'fs';

const router = express.Router();
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, './uploads/'); // Set the directory where the files should be stored
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname); // Set the filename to use for the file
    }
  });
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'video/mp4' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

router.post('/upload/:genre', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1}]), async (req, res) => {
    try {
        if (!req.files.video || !req.files.thumbnail) {
            return res.status(400).json({ msg: 'Video or thumbnail not uploaded' });
        }
        console.log("Buffers", req.files.video[0].path, req.files.thumbnail[0].path);

        const videoDb = await connect('videos');
        const bucket = new GridFSBucket(videoDb, { bucketName: 'videos' });

        const thumbDb = await connect('thumbnails');
        const thumbBucket = new GridFSBucket(thumbDb, { bucketName: 'thumbnails' });

        const videoNameNoExtention = path.parse(req.files.video[0].originalname).name;

        const videoStream = bucket.openUploadStream(videoNameNoExtention);
        const videoFileStream = fs.createReadStream(req.files.video[0].path);
        videoFileStream.pipe(videoStream);

        const videoUploadPromise = new Promise((resolve, reject) => {
            videoStream.on('finish', () => {
                console.log(videoStream.id);
                resolve(videoStream.id);    
        });
            videoStream.on('error', reject);
        })

        const videoFileInfo = await videoUploadPromise;

        const thumbnailStream = thumbBucket.openUploadStream(videoNameNoExtention + "_thumbnail", {
            metadata: { videoId: videoStream.id, videoName: videoNameNoExtention},
        });
        const thumbnailFileStream = fs.createReadStream(req.files.thumbnail[0].path);
        thumbnailFileStream.pipe(thumbnailStream);

        thumbnailStream.on('finish', () => {
            thumbDb.collection('ids').updateOne({ genre: req.params.genre }, {
                $push: { thumbnails: thumbnailStream.id },
            }, {
                upsert: true,
            });
            console.log(thumbnailStream.id);
            console.log("Updated thumbnails collection");
            res.status(201).json({
                video: videoNameNoExtention,
                thumbnail: req.files.thumbnail[0].originalname,
                videoId: videoStream.id.toString(),
                thumbnailId: thumbnailStream.id.toString()
            });
            fs.unlink(req.files.video[0].path, (err) => {
                if (err) {
                  console.error("Failed to delete the video file:", err);
                }
                console.log("Deleted video file")
            });
            fs.unlink(req.files.thumbnail[0].path, (err) => {
                if (err) {
                  console.error("Failed to delete the thumbnail file:", err);
                }
                console.log("Deleted thumbnail file")
            });    
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(501).json({ msg: 'Failed to upload files', error: error.message });
    }
});

router.get('/getVideo/:id', async (req, res) => {
    if (req.params.id === 'undefined') {
        res.status(290).json({ msg: 'Not playing anything' });
        return;
    }
    const db = await connect('videos');
    if (db == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    console.log("Fetching video: ", req.params.id);
    const bucket = new GridFSBucket(db, { bucketName: 'videos' });
    const cursor = bucket.find({_id: new ObjectId(req.params.id)});
    const video = await cursor.toArray();
    if (video.length === 0) {
        console.log(video);
        res.status(404).json({ msg: 'Video not found' });
        return;
    }
    const head = {
        'Content-Length': video[0].length,
        'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    const downloadStream = bucket.openDownloadStream(video[0]._id);
    console.log("Fetched video: ", video[0].filename);
    downloadStream.pipe(res);
});

router.get('/getThumbnails/:genre', async (req, res) => {
    const thumbDb = await connect('thumbnails');
    if (thumbDb == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const thumbnails = await thumbDb.collection('ids').findOne({ genre: req.params.genre });
    if (thumbnails != undefined) {
        console.log("Fetched " + req.params.genre + " thumbnails: ", thumbnails.thumbnails)
        res.status(200).json(thumbnails.thumbnails);
    } else {
        res.status(404).json({ msg: 'Genre not found' });
    }
});

router.get('/getThumbnail/:id', async (req, res) => {
    const thumbDb = await connect('thumbnails');
    if (thumbDb == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const bucket = new GridFSBucket(thumbDb, { bucketName: 'thumbnails' });
    const cursor = bucket.find({ _id: new ObjectId(req.params.id) });
    const thumbnail = await cursor.toArray();
    if (thumbnail.length === 0) {
        console.log("Thumbnail not found");
        res.status(404).json({ msg: 'Thumbnail not found' });
        return;
    }
    console.log("Fetched thumbnail: ", thumbnail[0].filename);
    const downloadStream = bucket.openDownloadStream(thumbnail[0]._id);
    downloadStream.pipe(res);
});

router.get('/getVideoInfo/:thumbId', async (req, res) => {
    const thumbDb = await connect('thumbnails');
    if (thumbDb == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const bucket = new GridFSBucket(thumbDb, { bucketName: 'thumbnails' });
    const cursor = bucket.find({ _id: new ObjectId(req.params.thumbId) });
    const thumbnail = await cursor.toArray();
    if (thumbnail.length === 0) {
        res.status(404).json({ msg: 'Video not found' });
        return;
    }
    console.log("Fetched thumbnail metadata: ", thumbnail[0].metadata);
    res.status(200).json(thumbnail[0].metadata);
});

router.get('/searchThumbnails/:searchParam', async (req, res) => {
    const thumbDb = await connect('thumbnails');
    if (thumbDb == null) {
        res.status(500).json({ msg: 'Could not connect to the database' });
        return;
    }
    const bucket = new GridFSBucket(thumbDb, { bucketName: 'thumbnails' });
    const searchParam = req.params.searchParam;
    const cursor = bucket.find({ filename: { $regex: searchParam, $options: 'i' } });
    const thumbnails = await cursor.toArray();
    console.log("Fetched thumbnails for search parameter: ", searchParam, thumbnails)
    if (thumbnails.length === 0) {
        res.status(404).json({ msg: 'Not found' });
        return;
    }
    const thumbnailIds = thumbnails.map(thumbnail => thumbnail._id);
    res.status(200).json(thumbnailIds);
});

export default router;