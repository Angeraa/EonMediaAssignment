import React, { useState } from 'react'
import Genre from '../components/Genre.jsx'

const Home = () => {
  const [Genres, setGenres] = useState(['For You', 'Comedy', 'Video Games', 'Music'])
  return (
    <div className='genre-list'>
      {/* {Genres.map((genre) => (
        <Genre key={genre} genre={genre} />
      ))} */}
      <video controls>
        <source src="http://localhost:4000/videos/getVideo" type="video/mp4"/>
      </video>
    </div>

  )
}

export default Home
