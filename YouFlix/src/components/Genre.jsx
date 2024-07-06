import React, { useEffect, useState } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import './Genre.css';
import Thumbnail from './Thumbnail';

const Genre = ({genre, setToPlay, possibleResults}) => {
  // responsive carousel settings
  const responsive = {
      superLargeDesktop: {
        breakpoint: { max: 4000, min: 3000 },
        items: 5,
        partialVisibilityGutter: 40
      },
      desktop: {
        breakpoint: { max: 3000, min: 1024 },
        items: 3,
        partialVisibilityGutter: 30
      },
      tablet: {
        breakpoint: { max: 1024, min: 700 },
        items: 2,
        partialVisibilityGutter: 20
      },
      mobile: {
        breakpoint: { max: 700, min: 0 },
        items: 1,
        partialVisibilityGutter: 10
      }
    };
  const [thumbnailIDs, setThumbnailIDs] = useState(possibleResults)
  
  // fetches the thumbnails for the genre
  const fetchThumbnails = async () => {
    const res = await fetch(`http://localhost:4000/videos/getThumbnails/${genre}`, { method: 'GET' });
    console.log(res);
    if (res.ok) {
      const data = await res.json();
      console.log("Fetched thumbnails: ", data)
      setThumbnailIDs(data)
    } else {
      console.log("Failed to fetch thumbnails")
    }
  }

  // fetches the thumbnails on component mount
  if (genre !== "Search Results") {
    useEffect(() => {
      fetchThumbnails()
    }, []) 
  }

  return (
    <div className='genre-wrapper'>
      <div className='genre-title'>{genre}</div>
      <Carousel className="carousel" 
                responsive={responsive} 
                infinite={true}
                centerMode={true}
                renderButtonGroupOutside={true}>
        {thumbnailIDs.map((id) => {
          return <Thumbnail key={id} id={id} setToPlay={setToPlay}/>
        })}
      </Carousel>
    </div>
  )
}

export default Genre
