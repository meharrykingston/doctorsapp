import { useEffect, useState, type CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import { fetchAppointments, type AppointmentRecord } from '../../services/appointmentsApi'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './dashboard.css'

type DashboardProps = {
  onNavigate: (route: AppRoute) => void
}

const fallbackAppointments = [
  {
    initials: 'RS',
    name: 'Rajesh Sharma',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    time: '10:30 AM',
    mode: 'OPD',
    concern: 'Hypertension review',
    eta: 'Patient 12 mins away',
  },
  {
    initials: 'PP',
    name: 'Priya Patel',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    time: '11:00 AM',
    mode: 'Video',
    concern: 'Migraine follow-up',
    eta: 'Tele room ready in 4 mins',
  },
  {
    initials: 'AK',
    name: 'Amit Kumar',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    time: '02:00 PM',
    mode: 'OPD',
    concern: 'Diabetes management',
    eta: 'Patient 28 mins away',
  },
  {
    initials: 'SR',
    name: 'Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80',
    time: '03:30 PM',
    mode: 'Video',
    concern: 'Post-op follow-up',
    eta: 'Room opens in 18 mins',
  },
]

const storeHighlights = [
  {
    name: 'Pulse Oximeter',
    price: 'INR 1,200',
    tag: 'Astikan Choice',
    category: 'Diagnostics',
    description: 'Portable clinic oxygen monitor',
    rating: 4.8,
    reviews: 1240,
    inStock: true,
    imageTone: 'blue',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Digital Thermometer',
    price: 'INR 500',
    tag: 'Quick Buy',
    category: 'Devices',
    description: '15 sec fever check',
    rating: 4.7,
    reviews: 840,
    inStock: true,
    imageTone: 'mint',
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'BP Monitor',
    price: 'INR 1,800',
    tag: 'Top Ordered',
    category: 'Devices',
    description: 'Large display digital BP kit',
    rating: 4.9,
    reviews: 910,
    inStock: true,
    imageTone: 'indigo',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80',
  },
  {
    name: 'Disposable Gloves',
    price: 'INR 500',
    tag: 'Refill',
    category: 'Protective',
    description: 'Latex-free box of 100',
    rating: 4.6,
    reviews: 680,
    inStock: true,
    imageTone: 'amber',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
  },
]

function Dashboard({ onNavigate }: DashboardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [appointments, setAppointments] = useState(fallbackAppointments)
  const profile = getDoctorProfile()
  const isVerified = profile.verificationStatus === 'verified'
  const displayName = profile.fullName ?? 'Dr. Sarah Kumar'
  const sideMenuItems: Array<{
    label: string
    route: AppRoute
    icon: 'settings' | 'calendar' | 'patients' | 'wallet' | 'store' | 'sparkles' | 'bell'
  }> = [
    { label: 'My Profile', route: 'settings', icon: 'settings' },
    { label: 'My Appointments', route: 'appointments', icon: 'calendar' },
    { label: 'My Patients', route: 'patients', icon: 'patients' },
    { label: 'Wallet', route: 'wallet', icon: 'wallet' },
    { label: 'Store', route: 'store', icon: 'store' },
    { label: 'Explore Cases', route: 'freelance-cases', icon: 'sparkles' },
    { label: 'Notifications', route: 'notifications', icon: 'bell' },
  ]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!profile.userId) return
    let active = true

    const formatTime = (value: string) =>
      new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))

    const mapAppointment = (item: AppointmentRecord) => {
      const isVideo = item.appointment_type === 'teleconsult'
      const etaMinutes = item.opd_visits?.[0]?.patient_eta_minutes
      const patientName = item.patient_name ?? item.employee_name ?? 'Patient'
      return {
        initials: patientName.slice(0, 2).toUpperCase(),
        name: patientName,
        photo:
          item.patient_avatar_url ??
          item.employee_avatar_url ??
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
        time: formatTime(item.scheduled_start),
        mode: isVideo ? 'Video' : 'OPD',
        concern: item.reason ?? item.patient_summary ?? 'Consultation follow-up',
        eta: isVideo
          ? 'Tele room ready shortly'
          : `Patient ${etaMinutes ?? 15} mins away`,
      }
    }

    void fetchAppointments({
      doctorId: profile.userId,
      status: 'confirmed',
      limit: 8,
    })
      .then((rows) => {
        if (!active || rows.length === 0) return
        setAppointments(rows.map(mapAppointment))
      })
      .catch(() => {
        // Keep fallback cards when backend data is unavailable.
      })

    return () => {
      active = false
    }
  }, [profile.userId])

  return (
    <section className="dashboard-page">
      <header className="mobile-topbar dashboard-topbar">
        <h1 className="astikan-logo-text">Astikan</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="notifications" onClick={() => onNavigate('notifications')}><AppIcon name="bell" className="bar-svg" /><span className="dot">3</span></button>
          <button type="button" className="bar-icon" aria-label="menu" onClick={() => setMenuOpen(true)}><AppIcon name="menu" className="bar-svg" /></button>
        </div>
      </header>

      <aside className={`offcanvas right-drawer doctor-offcanvas ${menuOpen ? 'open' : ''}`}>
        <div className="menu-head doctor-menu-head">
          <div className="doctor-profile-block">
            <div className="doctor-profile-avatar" aria-hidden="true">
              {(displayName.replace(/^Dr\.\s*/i, "").trim().slice(0, 2) || "DR").toUpperCase()}
            </div>
            <h3>{displayName}</h3>
            <p>Astikan</p>
            <div className="doctor-profile-meta">
              <span className="doctor-rating-pill"><AppIcon name="sparkles" className="tiny" /> 4.9</span>
              <span className={`doctor-verify-pill ${isVerified ? 'verified' : 'pending'}`}>
                <AppIcon name={isVerified ? 'check-circle' : 'lock'} className="tiny" />
                {isVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
          <button type="button" className="close-menu" onClick={() => setMenuOpen(false)} aria-label="close menu">
            <AppIcon name="close" className="bar-svg" />
          </button>
        </div>

        <nav className="menu-list">
          {sideMenuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="menu-item"
              onClick={() => {
                setMenuOpen(false)
                onNavigate(item.route)
              }}
            >
              <AppIcon name={item.icon} className="menu-icon" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        type="button"
        className={`menu-overlay ${menuOpen ? 'show' : ''}`}
        aria-label="close menu overlay"
        onClick={() => setMenuOpen(false)}
      />

      <main className="dashboard-content">
        <section className="benefit-card gold-wallet-banner card-rise joining-banner" style={{ '--d': '0ms' } as CSSProperties}>
          <div className="benefit-head"><span><AppIcon name="gift" className="small" /> Wallet Unlock Bonus</span><AppIcon name="lock" className="small lock" /></div>
          <h3>INR 5,000</h3>
          <p>Unlock INR 5,000 in wallet. Complete 5 consultations of your own clinic patients.</p>
          <div className="progress-row"><span>Progress</span><strong>3 / 5</strong></div>
          <div className="track"><i /></div>
          <button type="button" className="white-cta" onClick={() => onNavigate('wallet')}>Open Wallet</button>
        </section>

        <section className="stats-grid card-rise" style={{ '--d': '35ms' } as CSSProperties}>
          <article className="kpi-card"><AppIcon name="patients" className="kpi-icon purple" /><strong>8</strong><span>Patients</span><small>Active today</small></article>
          <article className="kpi-card"><AppIcon name="calendar" className="kpi-icon blue" /><strong>42</strong><span>Consultations</span><small>This week</small></article>
          <article className="kpi-card"><AppIcon name="trend" className="kpi-icon green" /><strong>INR 4.5K</strong><span>Earnings</span><small>Unlocked today</small></article>
        </section>

        <section className="dashboard-panel card-rise" style={{ '--d': '70ms' } as CSSProperties}>
          <div className="section-row">
            <div className="section-headline compact">
              <div>
                <h3 className="section-title pending-section-title">Pending Appointments</h3>
                <p>Upcoming confirmed cases lined up for consultation and OPD flow.</p>
              </div>
            </div>
            <button type="button" className="link-btn strong-link-btn" onClick={() => onNavigate('appointments')}>View All</button>
          </div>
          <div className="home-appointment-slider">
            {appointments.map((item, index) => (
              <article key={item.name} className={`appointment-card dashboard-appointment-card home-appointment-card ${item.mode === 'Video' ? 'video' : 'opd'}`} style={{ '--card-delay': `${index * 90}ms` } as CSSProperties}>
                <div className="avatar-wrap">
                  <img src={item.photo} alt={item.name} className="avatar-photo" />
                  <span className={`avatar-mode ${item.mode === 'Video' ? 'tele' : 'opd'}`}>
                    <AppIcon name={item.mode === 'Video' ? 'play' : 'stethoscope'} className="tiny" />
                  </span>
                </div>
                <div className="appointment-main">
                  <div className="appointment-title-row">
                    <h4>{item.name}</h4>
                    <span className={`appointment-mode-chip ${item.mode === 'Video' ? 'video' : 'opd'}`}>{item.mode}</span>
                  </div>
                  <p><AppIcon name="calendar" className="tiny" /> {item.time}</p>
                  <p>{item.concern}</p>
                  <small>{item.eta}</small>
                  <div className="home-appointment-actions">
                    <button type="button" className="primary" onClick={() => onNavigate('appointments')}>
                      <AppIcon name={item.mode === 'Video' ? 'play' : 'calendar'} className="tiny" /> {item.mode === 'Video' ? 'Join' : 'Track'}
                    </button>
                    <button type="button" className="ghost">Reschedule</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="store-preview dashboard-panel card-rise" style={{ '--d': '105ms' } as CSSProperties}>
          <div className="section-row">
            <div className="section-headline compact">
              <div>
                <h3 className="section-title">Store</h3>
                <p>Refill the most-used clinic essentials without leaving home.</p>
              </div>
            </div>
            <button type="button" className="link-btn strong-link-btn" onClick={() => onNavigate('store')}>Open Store</button>
          </div>
          <div className="store-preview-slider">
            {storeHighlights.map((item) => (
              <article key={item.name} className="product-card home-store-product-card" onClick={() => onNavigate('store')}>
                <div className={`product-image-box home-store-image-box ${item.imageTone}`}>
                  <span className="badge">{item.tag}</span>
                  <img src={item.imageUrl} alt={item.name} className="product-photo home-store-photo" />
                </div>
                <div className="product-main">
                  <h4>{item.name}</h4>
                  <p className="rating-row">
                    <strong>{item.rating.toFixed(1)} ★</strong>
                    <span>({new Intl.NumberFormat('en-IN').format(item.reviews)})</span>
                  </p>
                  <p>{item.description}</p>
                  <div className="meta">
                    <span>{item.category}</span>
                    <span className={item.inStock ? 'stock' : 'out'}>{item.inStock ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                </div>
                <div className="product-side home-store-side">
                  <strong>{item.price}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <button type="button" className="fab-btn ai-fab-btn" aria-label="open ai assistant" onClick={() => onNavigate('ai-assistant')}><AppIcon name="sparkles" className="fab-icon" /></button>

      <nav className="bottom-nav">
        <button type="button" className="nav-item active" onClick={() => onNavigate('dashboard')}><AppIcon name="home" className="nav-svg" /><span>Home</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}><AppIcon name="patients" className="nav-svg" /><span>Patients</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('appointments')}><AppIcon name="calendar" className="nav-svg" /><span>Appointments</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('freelance-cases')}><AppIcon name="sparkles" className="nav-svg" /><span>Explore</span></button>
        <button type="button" className="nav-item" onClick={() => onNavigate('store')}><AppIcon name="store" className="nav-svg" /><span>Store</span></button>
      </nav>
    </section>
  )
}

export default Dashboard


