import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import FestivalPlanner from './pages/FestivalPlanner'
import MeditationTimer from './pages/MeditationTimer'
import AmbientSoundscape from './pages/AmbientSoundscape'

function Navigation() {
  const location = useLocation()

  return (
    <nav>
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>🎨 VibeShack</h1>
        </Link>
        <div>
          <Link to="/calculator" className={location.pathname === '/calculator' ? 'active' : ''}>
            Taschenrechner
          </Link>
          <Link to="/festival-planner" className={location.pathname === '/festival-planner' ? 'active' : ''}>
            Festival Planner
          </Link>
          <Link to="/meditation-timer" className={location.pathname === '/meditation-timer' ? 'active' : ''}>
            Meditation
          </Link>
          <Link to="/ambient-soundscape" className={location.pathname === '/ambient-soundscape' ? 'active' : ''}>
            Soundscape
          </Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <HashRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/festival-planner" element={<FestivalPlanner />} />
        <Route path="/meditation-timer" element={<MeditationTimer />} />
        <Route path="/ambient-soundscape" element={<AmbientSoundscape />} />
      </Routes>
    </HashRouter>
  )
}

export default App
