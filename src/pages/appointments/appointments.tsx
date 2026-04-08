import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import { fetchAppointments, type AppointmentRecord } from '../../services/appointmentsApi'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './appointments.css'

type AppointmentsProps = {
  onNavigate: (route: AppRoute) => void
}

type AppointmentMode = 'Teleconsultation' | 'OPD'
type Segment = 'today' | 'upcoming' | 'past'

type AppointmentItem = {
  id: string
  initials: string
  name: string
  photo: string
  mode: AppointmentMode
  date: Date
  reason: string
  symptoms: string[]
  duration: string
  patientHistory: string
  additionalNotes: string
  status: 'Confirmed' | 'Pending' | 'Completed'
  patientDistanceKm?: number
}

const TELECONSULT_CASE_KEY = 'doctor:teleconsultCase'
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(value: Date) {
  return value.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function formatDay(value: Date) {
  return `${weekDays[value.getDay()]}, ${value.getDate()}`
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

function fallbackAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e7f0ff&color=2558a5&bold=true`
}

function toAppointmentItem(item: AppointmentRecord): AppointmentItem {
  const date = new Date(item.scheduled_start)
  const symptomsRaw = Array.isArray(item.symptom_snapshot_json?.selectedSymptoms)
    ? item.symptom_snapshot_json?.selectedSymptoms
    : []
  const symptoms = symptomsRaw.filter((value): value is string => typeof value === 'string')
  const patientName = item.patient_name ?? item.patient_summary ?? 'Patient'
  const mode: AppointmentMode = item.appointment_type === 'teleconsult' ? 'Teleconsultation' : 'OPD'
  const statusMap: Record<string, AppointmentItem['status']> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    underway: 'Pending',
    scheduled: 'Pending',
    rescheduled: 'Pending',
    cancelled: 'Pending',
    no_show: 'Pending',
  }
  return {
    id: item.id,
    initials: patientName.slice(0, 2).toUpperCase(),
    name: patientName,
    photo: item.patient_avatar_url ?? fallbackAvatar(patientName),
    mode,
    date,
    reason: item.reason ?? 'Consultation follow-up',
    symptoms: symptoms.length ? symptoms : ['General review'],
    duration: item.ai_triage_summary ? 'AI triaged' : 'Current case',
    patientHistory: item.patient_summary ?? 'Patient summary will appear here once captured.',
    additionalNotes: item.ai_triage_summary ?? 'No additional notes yet.',
    status: statusMap[item.status] ?? 'Pending',
    patientDistanceKm: item.opd_visits?.[0]?.patient_eta_minutes ? Math.max(1, Math.round(item.opd_visits[0].patient_eta_minutes / 4)) : undefined,
  }
}

function Appointments({ onNavigate }: AppointmentsProps) {
  const [activeSegment, setActiveSegment] = useState<Segment>('today')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const profile = getDoctorProfile()

  useEffect(() => {
    let active = true
    if (!profile.userId) {
      setAppointments([])
      setLoading(false)
      return
    }

    void fetchAppointments({ doctorId: profile.userId, limit: 100 })
      .then((rows) => {
        if (!active) return
        setAppointments(rows.map(toAppointmentItem))
      })
      .catch(() => {
        if (!active) return
        setAppointments([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [profile.userId])

  const stats = useMemo(() => {
    const total = appointments.length
    const completed = appointments.filter((item) => item.status === 'Completed').length
    const tele = appointments.filter((item) => item.mode === 'Teleconsultation').length
    return { total, completed, tele }
  }, [appointments])

  const calendarDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(now.getDate() + idx)
      return date
    })
  }, [now])

  const filtered = useMemo(() => {
    const list = appointments.filter((item) => {
      const sameDay = isSameDay(item.date, selectedDate)
      if (!sameDay) return false
      if (activeSegment === 'today') return isSameDay(item.date, now)
      if (activeSegment === 'upcoming') return item.date > now
      return item.date < now || item.status === 'Completed'
    })

    return list.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [activeSegment, appointments, selectedDate, now])

  function appointmentPill(item: AppointmentItem) {
    if (item.status === 'Completed') return 'completed'
    const diffMinutes = Math.round((item.date.getTime() - now.getTime()) / (1000 * 60))
    if (diffMinutes >= 0 && diffMinutes <= 60) return 'near'
    return 'normal'
  }

  function segmentLabel(segment: Segment) {
    if (segment === 'today') return 'Today'
    if (segment === 'upcoming') return 'Upcoming'
    return 'Past'
  }

  function openTeleconsultCase(item: AppointmentItem) {
    const payload = {
      id: item.id,
      name: item.name,
      initials: item.initials,
      reason: item.reason,
      symptoms: item.symptoms,
      duration: item.duration,
      patientHistory: item.patientHistory,
      additionalNotes: item.additionalNotes,
      date: item.date.toISOString(),
    }
    window.sessionStorage.setItem(TELECONSULT_CASE_KEY, JSON.stringify(payload))
    onNavigate('teleconsult-overview')
  }

  return (
    <section className="appointments-page">
      <header className="mobile-topbar appointments-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}>
          <AppIcon name="arrow-left" className="bar-svg" />
        </button>
        <h1>Appointments</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="notifications" onClick={() => onNavigate('notifications')}>
            <AppIcon name="bell" className="bar-svg" />
            <span className="dot">3</span>
          </button>
        </div>
      </header>

      <main className="appointments-content">
        <section className="appointments-hero card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <h2>Today&apos;s Clinical Flow</h2>
          <p>Manage teleconsultation and OPD visits with real-time priority cues.</p>
          <div className="hero-stats">
            <article>
              <strong>{stats.total}</strong>
              <span>Total Patients</span>
            </article>
            <article>
              <strong>{stats.completed}</strong>
              <span>Completed</span>
            </article>
            <article>
              <strong>{stats.tele}</strong>
              <span>Teleconsults</span>
            </article>
          </div>
        </section>

        <section className="calendar-strip card-rise" style={{ '--d': '40ms' } as CSSProperties}>
          <div className="strip-head">
            <h3>Appointment Calendar</h3>
            <span>{selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="strip-days">
            {calendarDays.map((date) => {
              const selected = isSameDay(date, selectedDate)
              const hasData = appointments.some((item) => isSameDay(item.date, date))
              return (
                <button key={date.toISOString()} type="button" className={`day-pill ${selected ? 'active' : ''}`} onClick={() => setSelectedDate(date)}>
                  <small>{weekDays[date.getDay()]}</small>
                  <strong>{date.getDate()}</strong>
                  {hasData ? <i /> : null}
                </button>
              )
            })}
          </div>
        </section>

        <section className="segment-tabs card-rise" style={{ '--d': '75ms' } as CSSProperties}>
          {(['today', 'upcoming', 'past'] as const).map((segment) => (
            <button key={segment} type="button" className={activeSegment === segment ? 'active' : ''} onClick={() => setActiveSegment(segment)}>
              {segmentLabel(segment)}
            </button>
          ))}
        </section>

        <section className="appointment-list">
          {loading ? (
            <article className="appointment-empty card-rise" style={{ '--d': '100ms' } as CSSProperties}>
              Loading appointments...
            </article>
          ) : filtered.length === 0 ? (
            <article className="appointment-empty card-rise" style={{ '--d': '100ms' } as CSSProperties}>
              No appointments in {segmentLabel(activeSegment).toLowerCase()} for {formatDay(selectedDate)}.
            </article>
          ) : (
            filtered.map((item, idx) => (
              <article key={item.id} className={`appointment-card card-rise ${appointmentPill(item)}`} style={{ '--d': `${95 + idx * 35}ms` } as CSSProperties}>
                <div className="avatar-wrap">
                  <img src={item.photo} alt={item.name} className="avatar-photo" />
                  <span className={`avatar-mode ${item.mode === 'Teleconsultation' ? 'tele' : 'opd'}`}>
                    <AppIcon name={item.mode === 'Teleconsultation' ? 'play' : 'stethoscope'} className="tiny" />
                  </span>
                </div>
                <div className="main">
                  <div className="head">
                    <div>
                      <h3>{item.name}</h3>
                      <span className="patient-id">{item.id}</span>
                    </div>
                    <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
                  </div>
                  <p>
                    <AppIcon name="clock" className="tiny" /> {formatTime(item.date)} <span>|</span> {formatDay(item.date)}
                  </p>
                  <p className="reason-line">{item.reason}</p>
                  <div className="symptom-row">
                    {item.symptoms.slice(0, 2).map((symptom) => (
                      <span key={symptom} className="symptom-chip">{symptom}</span>
                    ))}
                  </div>
                  <div className="mode-row">
                    <span className={`mode-tag ${item.mode === 'Teleconsultation' ? 'tele' : 'opd'}`}>{item.mode}</span>
                    {item.mode === 'OPD' ? <span className="distance-chip">Patient {item.patientDistanceKm ?? 0} km away</span> : null}
                  </div>
                  {item.mode === 'Teleconsultation' && item.status !== 'Completed' ? (
                    <div className="actions">
                      <button type="button" className="primary" onClick={() => openTeleconsultCase(item)}>
                        <AppIcon name="play" className="tiny" /> Join
                      </button>
                      <button type="button" className="ghost">Reschedule</button>
                    </div>
                  ) : null}
                  {item.mode === 'OPD' && item.status !== 'Completed' ? (
                    <div className="actions">
                      <button type="button" className="primary">Track Arrival</button>
                      <button type="button" className="ghost">Call Patient</button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      <button type="button" className="fab-btn" aria-label="new appointment"><AppIcon name="plus" className="fab-icon" /></button>

      <nav className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => onNavigate('dashboard')}><AppIcon name="home" className="nav-svg" /><span>Home</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}><AppIcon name="patients" className="nav-svg" /><span>Patients</span></button>
        <button type="button" className="nav-item active" onClick={() => onNavigate('appointments')}><AppIcon name="calendar" className="nav-svg" /><span>Appointments</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('freelance-cases')}><AppIcon name="sparkles" className="nav-svg" /><span>Explore</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('store')}><AppIcon name="store" className="nav-svg" /><span>Store</span></button>
      </nav>
    </section>
  )
}

export default Appointments
