import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/Upload.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <header>
          <NavBar />
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<About />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
