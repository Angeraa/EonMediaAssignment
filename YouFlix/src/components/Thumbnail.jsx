import React, { useEffect, useState, useRef } from 'react';
import './Thumbnail.css';

const Thumbnail = React.memo(({id, setToPlay}) => {

    const [videoId, setVideoId] = useState('');
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState('');

    useEffect(() => {
        const fetchThumbnail = async () => {
            console.log("Fetching thumbnail for id: ", id)
            const res = await fetch(`http://localhost:4000/videos/getThumbnail/${id}`, { method: 'GET' });
            if (!res.ok) {
                console.log("Failed to fetch thumbnail");
                return;
            }
            const data = await res.blob();
            const url = URL.createObjectURL(data);
            setThumbnail(url);
        }
        const fetchVideoInfo = async () => {
            const res = await fetch(`http://localhost:4000/videos/getVideoInfo/${id}`, { method: 'GET' });
            if (!res.ok) {
                console.log("Failed to fetch video info");
                console.log(res.status)
                return;
            }
            const data = await res.json();
            console.log("Fetched video info: ", data);
            setVideoId(data.videoId);
            setTitle(data.videoName);
        }
        fetchThumbnail();
        fetchVideoInfo();
    }, [])

    const handleClick = () => {
        console.log("Clicked on thumbnail: ", videoId);
        setToPlay(videoId);
    }

  return (
    <>
    <div className='thumbnail-wrapper'>
        <div className='thumbnail-background'>
            <img id={id} src={thumbnail} className='thumbnail-img' onClick={handleClick}></img>
        </div>
        <div className='video-title'>{title}</div>
    </div>
    </>
  )
})

export default Thumbnail
