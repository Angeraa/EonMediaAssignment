import React, { useState } from 'react'
import './SearchBar.css'
import { FaSearch } from 'react-icons/fa'
import Genre from './Genre'

const SearchBar = ({setToPlay}) => {
  const [SearchIn, setSearchIn] = useState("");
  const [searchedIds, setSearchedIds] = useState([]);

  // fetches thumbnail ids from the server
  const fetchData = async () => {
    console.log("Fetching data: " + SearchIn);
    if (SearchIn === "") {
      setSearchedIds([]);
      return;
    }
    const response = await fetch("http://localhost:4000/videos/searchThumbnails/" + SearchIn, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
      });
    const json = await response.json();
    console.log("Json data", json);
    if (response.ok) {
      setSearchedIds(json)
    }
  }
  return (
    <div>
      <div className='search-bar'>
          <FaSearch id="search-icon" />
          <input className='search-input'
                type='text' 
                placeholder='Search...' 
                value={SearchIn} 
                onChange={(e) => setSearchIn(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' ? fetchData() : null}
          />
      </div>
      {searchedIds.length !== 0 && <Genre genre='Search Results' setToPlay={setToPlay} possibleResults={searchedIds}/>}
    </div>
  )
}

export default SearchBar
