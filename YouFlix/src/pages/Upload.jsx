import React, { useState, useEffect, useRef } from 'react'
import './Upload.css';
import videojs from 'video.js';
import VideoJS from '../components/VideoJS.jsx';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [genre, setGenre] = useState('');
  const playerRef = useRef(null);
  const [options, setOptions] = useState({
    controls: true,
    responsive: true,
    height: 300,
    width: 500,
    sources: [{
      src: "",
      type: 'video/mp4'
    }]
  }); 

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.on('waiting', () => {
      videojs.log('Player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('Player is disposed');
    });
  };

  const handleVideoFileChange = (e) => {
    console.log("File added: ", e.target.files[0]);
    setFile(e.target.files[0]);
    const url = URL.createObjectURL(e.target.files[0]);
    setOptions({
      ...options,
      sources: [{
        src: url,
        type: 'video/mp4'
      }]
    });
  }; 

  const handleThumbnailChange = (e) => {
    console.log("Thumbnail added: ", e.target.files[0]);
    setThumbnail(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !thumbnail || !genre) {
      console.log("Please fill out all fields");
      return;
    }
    const formData = new FormData();
    formData.append('video', file);
    formData.append('thumbnail', thumbnail);

    const res = await fetch('http://localhost:4000/videos/upload/' + genre, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div className='upload-wrapper'>
      <form className="forms" onSubmit={handleSubmit}>
        <div className='form'>
          <label htmlFor="videoFile">Video File (MP4):</label>
          <input
            type="file"
            id="videoFile"
            name="videoFile"
            accept="video/mp4"
            onChange={handleVideoFileChange}
          />
        </div>
        <div className='form'>
          <label htmlFor="thumbnailImage">Thumbnail Image:</label>
          <input
            type="file"
            id="thumbnailImage"
            name="thumbnailImage"
            accept="image/*"
            onChange={handleThumbnailChange}
          />
        </div>
        <div className='form'>
          <label htmlFor="genreSelect">Genre:</label>
          <select id="genreSelect" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Select a Genre</option>
            <option value="Music">Music</option>
            <option value="Cooking">Cooking</option>
          </select>
        </div>
        <button className='submit' type="submit">Upload</button>
      </form>
      <VideoJS key={options.sources[0].src} options={options} onReady={handlePlayerReady} centered={false}/>
    </div>
  )
}

export default Upload
