import React, { useEffect, useState } from 'react';
import Genre from '../components/Genre.jsx';
import VideoJS from '../components/VideoJS.jsx';
import SearchBar from '../components/SearchBar.jsx';

const Home = () => {
  const [Genres, setGenres] = useState(['Music', 'Cooking'])
  const [playerRef, setPlayerRef] = useState(null)
  const [toPlay, setToPlay] = useState('undefined')
  const [options, setOptions] = useState({
    controls: true,
    responsive: true,
    height: 600,
    width: 1000,
    sources: [{
    src: `http://localhost:4000/videos/getVideo/undefined`,
    type: 'video/mp4'
    }]
  });

  useEffect(() => {
    setOptions({
      ...options,
      sources: [{
        src: `http://localhost:4000/videos/getVideo/${toPlay}`,
        type: 'video/mp4'
      }]
    });
  }, [toPlay])

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.on('waiting', () => {
      videojs.log('Player is waiting');
    });

    player.on('dispose', () => {
      videojs.log('Player is disposed');
    });
  };

  return (
    <div>
      <SearchBar setToPlay={setToPlay}/>
      <div className='genre-list'>
        {Genres.map((genre) => {
          return <Genre key={genre} genre={genre} setToPlay={setToPlay} possibleResults={[]}/>
        })}
        {toPlay !== 'undefined' && <VideoJS key={options.sources[0].src} options={options} onReady={handlePlayerReady} setToPlay={setToPlay} centered={true}/>}
      </div>
    </div>
  )
}

export default Home
