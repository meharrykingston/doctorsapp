import type { CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import type { AppRoute } from '../../types/routes'
import './learning.css'

type LearningProps = {
  onNavigate: (route: AppRoute) => void
}

const modules = [
  { title: 'Dengue Fever: Clinical Management Protocol', desc: 'Evidence-based guidelines for dengue diagnosis and management', category: 'Infectious Disease', duration: '15 min', done: true },
  { title: 'Diabetic Emergencies: DKA & HHS', desc: 'Recognition and initial management of diabetic emergencies', category: 'Endocrinology', duration: '20 min', done: true },
  { title: 'Acute Coronary Syndrome: STEMI Management', desc: 'Time-critical management of STEMI patients', category: 'Cardiology', duration: '25 min', done: false },
  { title: 'Pediatric Fever: Red Flags & Management', desc: 'Identifying serious bacterial infections in children', category: 'Pediatrics', duration: '18 min', done: false },
  { title: 'Antibiotic Stewardship in Primary Care', desc: 'Rational antibiotic prescribing practices', category: 'Clinical Guidelines', duration: '22 min', done: false, locked: true },
]

function Learning({ onNavigate }: LearningProps) {
  return (
    <section className="learning-page">
      <header className="mobile-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}><AppIcon name="arrow-left" className="bar-svg" /></button>
        <h1>Learning</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="search"><AppIcon name="search" className="bar-svg" /></button>
          <button type="button" className="bar-icon" aria-label="notifications"><AppIcon name="bell" className="bar-svg" /><span className="dot">3</span></button>
        </div>
      </header>

      <main className="learning-content">
        <section className="hero card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <h2>Learning Center</h2>
          <p>Complete clinical training modules to enhance your practice</p>
        </section>

        <section className="progress-card card-rise" style={{ '--d': '35ms' } as CSSProperties}>
          <div className="row"><span className="chip"><AppIcon name="gift" className="tiny" /></span><div><h3>Your Learning Progress</h3><p>2 of 5 modules completed</p></div><strong>40%</strong></div>
          <div className="track"><i /></div>
          <p>Complete learning modules to become eligible for wallet benefit unlock</p>
        </section>

        <section className="complete-card card-rise" style={{ '--d': '70ms' } as CSSProperties}>
          <h3><AppIcon name="check-circle" className="tiny" /> Completed</h3>
          <strong>2</strong>
          <p>Training module</p>
        </section>

        <section className="card-rise" style={{ '--d': '105ms' } as CSSProperties}>
          <h3 className="section-title">Available Modules</h3>
          <div className="module-list">
            {modules.map((item, idx) => (
              <article key={item.title} className={`module-card ${item.done ? 'done' : ''} ${item.locked ? 'locked' : ''}`} style={{ '--d': `${130 + idx * 28}ms` } as CSSProperties}>
                <span className="icon"><AppIcon name={item.locked ? 'lock' : item.done ? 'check-circle' : 'play'} className="tiny" /></span>
                <div className="module-main">
                  <div className="head"><h4>{item.title}</h4>{item.locked ? <span className="state">Locked</span> : <button type="button" className="state-btn">{item.done ? 'Review' : 'Start'}</button>}</div>
                  <p>{item.desc}</p>
                  <div className="meta"><span>{item.category}</span><span><AppIcon name="clock" className="tiny" /> {item.duration}</span>{item.done && <span className="done-tag">Completed</span>}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="benefits card-rise" style={{ '--d': '280ms' } as CSSProperties}>
          <h3><AppIcon name="sparkles" className="tiny" /> Learning Benefits</h3>
          <ul>
            <li>Stay updated with latest clinical guidelines and protocols</li>
            <li>Earn continuing medical education (CME) credits</li>
            <li>Complete modules to unlock wallet benefits eligibility</li>
            <li>Access evidence-based clinical decision support</li>
            <li>New modules added regularly based on clinical relevance</li>
          </ul>
        </section>
      </main>

      <button type="button" className="fab-btn" aria-label="open ai" onClick={() => onNavigate('settings')}><AppIcon name="plus" className="fab-icon" /></button>

      <nav className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => onNavigate('dashboard')}><AppIcon name="home" className="nav-svg" /><span>Home</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}><AppIcon name="patients" className="nav-svg" /><span>Patients</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('appointments')}><AppIcon name="calendar" className="nav-svg" /><span>Appointments</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('freelance-cases')}><AppIcon name="sparkles" className="nav-svg" /><span>Explore</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('store')}><AppIcon name="store" className="nav-svg" /><span>Store</span></button>
      </nav>
    </section>
  )
}

export default Learning


