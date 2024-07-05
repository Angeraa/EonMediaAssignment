import express from 'express';
import cors from 'cors';
import router from './upload.js';

//initializing express
const app = express();
app.use(cors());

//middleware
app.use('/videos', router);

//listening
app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
