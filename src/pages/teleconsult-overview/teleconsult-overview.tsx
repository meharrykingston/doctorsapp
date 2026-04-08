import { useMemo, type CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import type { AppRoute } from '../../types/routes'
import './teleconsult-overview.css'

type TeleconsultOverviewProps = {
  onNavigate: (route: AppRoute) => void
}

type TeleconsultCase = {
  id: string
  appointmentId?: string
  teleconsultSessionId?: string
  employeeId?: string
  companyId?: string
  name: string
  initials: string
  reason: string
  symptoms: string[]
  duration: string
  patientHistory: string
  additionalNotes: string
  date: string
}

const STORAGE_KEY = 'doctor:teleconsultCase'

const fallbackCase: TeleconsultCase = {
  id: 'APT-1',
  name: 'Rajesh Sharma',
  initials: 'RS',
  reason: 'Hypertension follow-up',
  symptoms: ['Headache', 'Mild chest heaviness', 'Fatigue'],
  duration: '2 days',
  patientHistory: 'Known hypertension for 4 years; on Amlodipine.',
  additionalNotes: 'BP fluctuation during high stress.',
  date: new Date().toISOString(),
}

function readCase(): TeleconsultCase {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return fallbackCase
    const parsed = JSON.parse(raw) as Partial<TeleconsultCase>
    if (!parsed.name || !parsed.id) return fallbackCase
    return {
      ...fallbackCase,
      ...parsed,
      symptoms: parsed.symptoms ?? fallbackCase.symptoms,
    }
  } catch {
    return fallbackCase
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function TeleconsultOverview({ onNavigate }: TeleconsultOverviewProps) {
  const currentCase = useMemo(() => readCase(), [])

  return (
    <section className="tele-overview-page">
      <header className="mobile-topbar tele-overview-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('appointments')}>
          <AppIcon name="arrow-left" className="bar-svg" />
        </button>
        <h1>Case Overview</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="notifications" onClick={() => onNavigate('notifications')}>
            <AppIcon name="bell" className="bar-svg" />
            <span className="dot">3</span>
          </button>
        </div>
      </header>

      <main className="tele-overview-content">
        <section className="tele-case-hero card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <div className="hero-left">
            <span className="avatar">{currentCase.initials}</span>
            <div>
              <h2>{currentCase.name}</h2>
              <p>{currentCase.id} | {formatDateTime(currentCase.date)}</p>
            </div>
          </div>
          <span className="live-pill">Live Soon</span>
        </section>

        <section className="tele-card card-rise" style={{ '--d': '35ms' } as CSSProperties}>
          <h3>Patient Shared Summary</h3>
          <p><strong>Concern:</strong> {currentCase.reason}</p>
          <p><strong>Duration:</strong> {currentCase.duration}</p>
          <p><strong>Medical History:</strong> {currentCase.patientHistory}</p>
          <p><strong>Additional Notes:</strong> {currentCase.additionalNotes}</p>
          <div className="chips">
            {currentCase.symptoms.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        <section className="tele-card ai-analysis card-rise" style={{ '--d': '70ms' } as CSSProperties}>
          <h3>AI Clinical Analysis</h3>
          <ul>
            <li>Primary likelihood: Stress-triggered blood pressure fluctuations.</li>
            <li>Secondary checks: Hypertensive urgency red-flag screening.</li>
            <li>Suggested early diagnostics: BP trend, ECG if chest heaviness persists.</li>
          </ul>
        </section>

        <section className="tele-card treatment card-rise" style={{ '--d': '105ms' } as CSSProperties}>
          <h3>Suggested Treatment Path</h3>
          <article>
            <strong>Immediate</strong>
            <p>Assess vitals, confirm medication adherence, evaluate chest symptoms severity.</p>
          </article>
          <article>
            <strong>During Consultation</strong>
            <p>Adjust anti-hypertensive plan if needed and advise stress management protocol.</p>
          </article>
          <article>
            <strong>Follow-up</strong>
            <p>48-hour check-in, home BP log, and escalation criteria communication.</p>
          </article>
        </section>

        <section className="tele-actions card-rise" style={{ '--d': '140ms' } as CSSProperties}>
          <button type="button" className="join-btn" onClick={() => onNavigate('teleconsult-room')}>
            <AppIcon name="check-circle" className="tiny" /> Join Consultation
          </button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate('appointments')}>
            Back to Appointments
          </button>
        </section>
      </main>
    </section>
  )
}

export default TeleconsultOverview
