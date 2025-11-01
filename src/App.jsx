import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
import FestivalPlanner from './pages/FestivalPlanner'
import AmbientMusicGenerator from './pages/AmbientMusicGenerator'
import MeditationTimer from './pages/MeditationTimer'

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
          <Link to="/ambient-music" className={location.pathname === '/ambient-music' ? 'active' : ''}>
            Ambient Music
          <Link to="/meditation-timer" className={location.pathname === '/meditation-timer' ? 'active' : ''}>
            Meditation
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
        <Route path="/ambient-music" element={<AmbientMusicGenerator />} />
        <Route path="/meditation-timer" element={<MeditationTimer />} />
      </Routes>
    </HashRouter>
  )
}

export default App
