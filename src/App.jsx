import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import FestivalPlanner from './pages/FestivalPlanner'

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
          <Link to="/festival-planner" className={location.pathname === '/festival-planner' ? 'active' : ''}>
            Festival Planner
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
        <Route path="/festival-planner" element={<FestivalPlanner />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
