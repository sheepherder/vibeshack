import { Link } from 'react-router-dom'

function Home() {
  const experiments = [
    {
      id: 'calculator',
      title: 'Taschenrechner',
      description: 'Ein einfacher, aber eleganter Taschenrechner für Grundrechenarten',
      path: '/calculator'
    },
    {
      id: 'festival-planner',
      title: 'Festival Planner',
      description: 'Planungstool für das Festival der Zukunft 2026 mit Drag & Drop und CSV Export',
      path: '/festival-planner'
    },
    {
      id: 'meditation-timer',
      title: 'Meditations-Timer',
      description: 'Timer für verschiedene Meditationsarten mit Instruktionen, anpassbaren Zeiten und Klangschalen-Sound',
      path: '/meditation-timer'
    },
    {
      id: 'ambient-soundscape',
      title: 'Ambient Soundscape',
      description: 'Relax zu einfachen, loopenden Beats - ein Drum-Loop-Player zum Viben und Entspannen',
      path: '/ambient-soundscape'
    },
    // Hier können später weitere Experimente hinzugefügt werden
  ]

  return (
    <div className="container">
      <h1 className="page-title">Willkommen im VibeShack! 🚀</h1>
      <p className="page-subtitle">
        Eine Sammlung von kreativen Experimenten und Ideen. Erkunde verschiedene
        Web-Technologien und interaktive Demos.
      </p>

      <h2 className="section-title">
        Verfügbare Experimente
      </h2>

      <div className="experiments-grid">
        {experiments.map((experiment) => (
          <Link
            key={experiment.id}
            to={experiment.path}
            className="experiment-card"
          >
            <h3>{experiment.title}</h3>
            <p>{experiment.description}</p>
          </Link>
        ))}
      </div>

      <div className="about-section">
        <h3>Über dieses Projekt</h3>
        <p>
          VibeShack ist ein Playground für verschiedene Web-Experimente. Jedes Experiment
          zeigt unterschiedliche Techniken und Ansätze in der Web-Entwicklung.
        </p>
      </div>

      {/* Build Info - automatisch generiert bei jedem Build */}
      <div className="build-info">
        <div>
          Build: {__GIT_COMMIT_DATE__} ({__GIT_COMMIT_HASH__})
        </div>
      </div>
    </div>
  )
}

export default Home
