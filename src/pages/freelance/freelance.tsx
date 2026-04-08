import { useMemo, useState, type CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './freelance.css'

type FreelanceProps = {
  onNavigate: (route: AppRoute) => void
}

type CaseItem = {
  id: string
  hospital: string
  speciality: string
  caseType: string
  city: string
  budgetInr: number
  mode: 'Virtual' | 'Physical' | 'Hybrid'
  urgency: 'High' | 'Medium' | 'Low'
  etaMins: number
  condition: string
  bidCount: number
}

type Screen = 'list' | 'detail' | 'bid' | 'submitting' | 'result'

type Bidder = {
  doctor: string
  photo: string
  readiness: string
  note: string
}

const openCases: CaseItem[] = [
  {
    id: 'FC-2011',
    hospital: 'MetroCare Hospital',
    speciality: 'Cardiology',
    caseType: 'Post-PCI review',
    city: 'New Delhi',
    budgetInr: 7000,
    mode: 'Hybrid',
    urgency: 'High',
    etaMins: 18,
    condition: 'Chest heaviness, BP fluctuation, mild dizziness',
    bidCount: 12,
  },
  {
    id: 'FC-2012',
    hospital: 'Sunrise Multispeciality',
    speciality: 'Neurology',
    caseType: 'Acute migraine protocol',
    city: 'Pune',
    budgetInr: 4500,
    mode: 'Virtual',
    urgency: 'Medium',
    etaMins: 26,
    condition: 'Severe unilateral headache, nausea, light sensitivity',
    bidCount: 7,
  },
  {
    id: 'FC-2013',
    hospital: 'Greenline Clinic',
    speciality: 'Pulmonology',
    caseType: 'COPD escalation',
    city: 'Chennai',
    budgetInr: 5200,
    mode: 'Physical',
    urgency: 'High',
    etaMins: 14,
    condition: 'Breathlessness on exertion, wheeze, low SpO2 trend',
    bidCount: 15,
  },
  {
    id: 'FC-2014',
    hospital: 'CityCare Hospital',
    speciality: 'Dermatology',
    caseType: 'Drug-rash evaluation',
    city: 'Hyderabad',
    budgetInr: 3900,
    mode: 'Virtual',
    urgency: 'Low',
    etaMins: 30,
    condition: 'Diffuse rash with itching after antibiotic exposure',
    bidCount: 5,
  },
]

function formatINR(value: number) {
  return `INR ${new Intl.NumberFormat('en-IN').format(value)}`
}

function aiSuggestedTreatment(caseItem: CaseItem) {
  if (caseItem.speciality === 'Cardiology') {
    return 'Initial vitals trend, ECG review, anti-hypertensive adherence check, and 48-hour monitoring plan.'
  }
  if (caseItem.speciality === 'Pulmonology') {
    return 'Evaluate SpO2 and RR, bronchodilator optimization, inhaler-technique correction, and red-flag escalation criteria.'
  }
  if (caseItem.speciality === 'Neurology') {
    return 'Pain severity assessment, trigger mapping, acute migraine rescue protocol, and preventive regimen advice.'
  }
  return 'Focused history, symptom severity assessment, differential confirmation, and short follow-up cycle.'
}

function playSuccessTick() {
  try {
    const AudioContextRef = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextRef) return
    const ctx = new AudioContextRef()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(780, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.22)
    window.setTimeout(() => void ctx.close(), 260)
  } catch {
    // ignore audio failures
  }
}

function FreelanceCases({ onNavigate }: FreelanceProps) {
  const profile = getDoctorProfile()
  const doctorName = profile.fullName ?? 'You'
  const doctorSpecialities = profile.specializations?.length ? profile.specializations : ['Cardiology', 'Pulmonology', 'Neurology']

  const [screen, setScreen] = useState<Screen>('list')
  const [query, setQuery] = useState('')
  const [specialityFilter, setSpecialityFilter] = useState<string>('All Cases')
  const [selectedCaseId, setSelectedCaseId] = useState(openCases[0].id)
  const [bidAmount, setBidAmount] = useState('6000')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [submitted, setSubmitted] = useState<Bidder[]>([])
  const [submitMessage, setSubmitMessage] = useState('')

  const selectedCase = useMemo(
    () => openCases.find((item) => item.id === selectedCaseId) ?? openCases[0],
    [selectedCaseId],
  )

  const filteredCases = useMemo(() => {
    const text = query.trim().toLowerCase()
    return openCases.filter((item) => {
      const byDoctorSpec = specialityFilter === 'All Cases' || item.speciality === specialityFilter
      const byText =
        !text ||
        `${item.hospital} ${item.caseType} ${item.speciality} ${item.condition}`.toLowerCase().includes(text)
      return byDoctorSpec && byText
    })
  }, [query, specialityFilter, doctorSpecialities])

  function openCaseOverview(caseId: string) {
    setSelectedCaseId(caseId)
    setScreen('detail')
  }

  function submitBid() {
    const amount = Number(bidAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    if (!treatmentPlan.trim()) return

    const roster: Bidder[] = [
      {
        doctor: 'Dr. Aryan Shah',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
        readiness: 'Ready in 20 mins',
        note: 'Cardiac monitoring setup ready',
      },
      {
        doctor: 'Dr. Sanya Rao',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
        readiness: 'Ready in 35 mins',
        note: 'Can start in 20 mins',
      },
      {
        doctor: 'Dr. Mehul Jain',
        photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
        readiness: 'Evening slot open',
        note: 'Available in evening slot',
      },
      {
        doctor: doctorName,
        photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80',
        readiness: amount >= 6500 ? 'Fastest response bracket' : 'Standard response queue',
        note: treatmentPlan.trim(),
      },
    ]

    const sorted = [...roster].sort((a, b) => {
      if (a.doctor === doctorName) return -1
      if (b.doctor === doctorName) return 1
      return a.readiness.localeCompare(b.readiness)
    })
    setScreen('submitting')
    setSubmitMessage('Submitting your bid to the hospital case board...')
    window.setTimeout(() => {
      setSubmitted(sorted)
      setSubmitMessage('Submitted successfully')
      playSuccessTick()
      setScreen('result')
    }, 1500)
  }

  return (
    <section className="freelance-page">
      <header className="mobile-topbar freelance-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}>
          <AppIcon name="arrow-left" className="bar-svg" />
        </button>
        <h1>Freelance Cases</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="notifications" onClick={() => onNavigate('notifications')}>
            <AppIcon name="bell" className="bar-svg" />
            <span className="dot">3</span>
          </button>
        </div>
      </header>

      <main className="freelance-content">
        {screen === 'list' ? (
          <>
            <section className="freelance-banner card-rise" style={{ '--d': '0ms' } as CSSProperties}>
              <h2>Hospitals Need Specialists On-Demand</h2>
              <p>Find matching requirements and bid instantly for high-value cases.</p>
            </section>

            <section className="case-controls card-rise" style={{ '--d': '30ms' } as CSSProperties}>
              <div className="search-box">
                <AppIcon name="search" className="tiny" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cases..." />
              </div>
              <select value={specialityFilter} onChange={(event) => setSpecialityFilter(event.target.value)}>
                <option>All Cases</option>
                {doctorSpecialities.map((spec) => (
                  <option key={spec}>{spec}</option>
                ))}
              </select>
            </section>

            <section className="case-list card-rise" style={{ '--d': '60ms' } as CSSProperties}>
              <h3>Open Requirements</h3>
              <div className="case-items">
                {filteredCases.map((item) => (
                  <button key={item.id} type="button" className="case-item" onClick={() => openCaseOverview(item.id)}>
                    <div className="row">
                      <strong>{item.speciality}</strong>
                      <span className={`urgency ${item.urgency.toLowerCase()}`}>{item.urgency}</span>
                    </div>
                    <p>{item.hospital}</p>
                    <small>{item.caseType} | {item.mode}</small>
                    <div className="meta-row">
                      <span>{item.etaMins} mins away</span>
                      <span>{item.bidCount} bids</span>
                    </div>
                    <div className="condition">{item.condition}</div>
                    <b>{formatINR(item.budgetInr)}</b>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {screen === 'detail' ? (
          <section className="detail-page">
            <section className="freelance-banner card-rise" style={{ '--d': '0ms' } as CSSProperties}>
              <h2>{selectedCase.hospital}</h2>
              <p>{selectedCase.id} | {selectedCase.speciality} | {selectedCase.etaMins} mins away</p>
            </section>

            <section className="detail-card card-rise" style={{ '--d': '35ms' } as CSSProperties}>
              <h3>Requirement Overview</h3>
              <p><strong>Case:</strong> {selectedCase.caseType}</p>
              <p><strong>Budget:</strong> {formatINR(selectedCase.budgetInr)}</p>
              <p><strong>Mode:</strong> {selectedCase.mode}</p>
              <p><strong>Patient Condition:</strong> {selectedCase.condition}</p>
            </section>

            <section className="detail-card ai card-rise" style={{ '--d': '70ms' } as CSSProperties}>
              <h3>AI Suggested Treatment</h3>
              <p>{aiSuggestedTreatment(selectedCase)}</p>
            </section>

            <section className="detail-actions card-rise" style={{ '--d': '105ms' } as CSSProperties}>
              <button type="button" className="primary" onClick={() => setScreen('bid')}>Bid for this Case</button>
              <button type="button" className="ghost" onClick={() => setScreen('list')}>Back to Cases</button>
            </section>
          </section>
        ) : null}

        {screen === 'bid' ? (
          <section className="detail-page">
            <section className="detail-card card-rise" style={{ '--d': '0ms' } as CSSProperties}>
              <h3>Submit Your Bid</h3>
              <label>
                Bid Amount
                <input value={bidAmount} onChange={(event) => setBidAmount(event.target.value.replace(/[^\d]/g, ''))} />
              </label>
              <label>
                How will you treat this case?
                <textarea
                  value={treatmentPlan}
                  onChange={(event) => setTreatmentPlan(event.target.value)}
                  placeholder="Brief treatment approach, required equipment, consultation language, and execution timeline."
                />
              </label>
            </section>

            <section className="detail-actions card-rise" style={{ '--d': '35ms' } as CSSProperties}>
              <button type="button" className="primary" onClick={submitBid}>Submit Bid</button>
              <button type="button" className="ghost" onClick={() => setScreen('detail')}>Back</button>
            </section>
          </section>
        ) : null}

        {screen === 'submitting' ? (
          <section className="detail-page">
            <section className="submit-loading-card card-rise" style={{ '--d': '0ms' } as CSSProperties}>
              <div className="submit-loader-orb">
                <span />
                <span />
                <span />
              </div>
              <h3>Submitting your bid</h3>
              <p>{submitMessage}</p>
            </section>
          </section>
        ) : null}

        {screen === 'result' ? (
          <section className="detail-page">
            <section className="bid-success-card card-rise" style={{ '--d': '0ms' } as CSSProperties}>
              <div className="success-tick-ring">
                <AppIcon name="check-circle" className="success-tick-icon" />
              </div>
              <h3>Submitted Successfully</h3>
              <p>Your case response is now visible to the hospital team.</p>
            </section>

            <section className="ranking-list card-rise" style={{ '--d': '35ms' } as CSSProperties}>
              {submitted.map((item, idx) => (
                <article key={`${item.doctor}-${idx}`}>
                  <div className="bidder-left">
                    <img src={item.photo} alt={item.doctor} className="bidder-photo" />
                    <div>
                      <strong>{idx + 1}. {item.doctor}</strong>
                      <small>{item.readiness}</small>
                    </div>
                  </div>
                  <div className="right">
                    <b>Bid placed</b>
                    <p>{item.note}</p>
                  </div>
                </article>
              ))}
            </section>

            <section className="detail-actions card-rise" style={{ '--d': '70ms' } as CSSProperties}>
              <button type="button" className="primary" onClick={() => setScreen('list')}>Back to Cases</button>
            </section>
          </section>
        ) : null}
      </main>

      <nav className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => onNavigate('dashboard')}><AppIcon name="home" className="nav-svg" /><span>Home</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}><AppIcon name="patients" className="nav-svg" /><span>Patients</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('appointments')}><AppIcon name="calendar" className="nav-svg" /><span>Appointments</span></button>
        <button type="button" className="nav-item active" onClick={() => onNavigate('freelance-cases')}><AppIcon name="sparkles" className="nav-svg" /><span>Explore</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('store')}><AppIcon name="store" className="nav-svg" /><span>Store</span></button>
      </nav>
    </section>
  )
}

export default FreelanceCases
