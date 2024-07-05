import React from 'react'
import { Link } from 'react-router-dom'
import './NavBar.css'

const NavBar = () => {
  return (
    <div className='nav-left'>
        <Link to='/' className='navbar-element'>Home</Link>
        <Link to='/upload' className='navbar-element'>Upload</Link>
    </div>
  )
}

export default NavBar
