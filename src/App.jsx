import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Calculator from './pages/Calculator'

function Navigation() {
  const location = useLocation()

  return (
    <nav>
      <div className="container">
        <h1>🎨 VibeShack</h1>
        <div>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/calculator" className={location.pathname === '/calculator' ? 'active' : ''}>
            Taschenrechner
          </Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter basename="/vibeshack">
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
