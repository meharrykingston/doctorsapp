import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AppIcon } from '../../components/ui/icons'
import { fetchDoctorProfile, saveDoctorProfileRemote } from '../../services/doctorApi'
import { clearDoctorSession } from '../../services/authApi'
import type { AppRoute } from '../../types/routes'
import { clearDoctorProfile, getDoctorProfile, saveDoctorProfile } from '../../utils/doctorProfile'
import './settings.css'

type SettingsProps = {
  onNavigate: (route: AppRoute) => void
}

function Settings({ onNavigate }: SettingsProps) {
  const cachedProfile = getDoctorProfile()
  const [fullName, setFullName] = useState(cachedProfile.fullName?.replace(/^Dr\.\s*/i, '') ?? 'Sarah Kumar')
  const [email, setEmail] = useState(cachedProfile.email ?? 'doctor@astikan.com')
  const [mobile, setMobile] = useState(cachedProfile.mobile ?? '')
  const [practiceAddress, setPracticeAddress] = useState(cachedProfile.practiceAddress ?? 'Astikan OPD Clinic, Connaught Place, New Delhi')
  const [shortBio, setShortBio] = useState(
    cachedProfile.shortBio ?? 'General physician focused on patient-first care, teleconsultation, and continuity follow-up.',
  )
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!cachedProfile.userId) return
    let active = true

    void fetchDoctorProfile(cachedProfile.userId)
      .then((payload) => {
        if (!active || !payload) return
        const profilePatch = {
          fullName: payload.full_display_name ?? cachedProfile.fullName,
          email: payload.email ?? cachedProfile.email,
          mobile: payload.mobile ?? cachedProfile.mobile,
          practiceAddress: payload.practice_address ?? cachedProfile.practiceAddress,
          shortBio: payload.short_bio ?? cachedProfile.shortBio,
          highestQualification: payload.highest_qualification ?? cachedProfile.highestQualification,
          experienceYears: payload.experience_years ?? cachedProfile.experienceYears,
          medicalCouncilNumber: payload.medical_council_number ?? cachedProfile.medicalCouncilNumber,
          specializations: Array.isArray(payload.doctor_specializations)
            ? payload.doctor_specializations
                .map((item: { specialization_name?: string }) => item.specialization_name)
                .filter((value): value is string => Boolean(value))
            : cachedProfile.specializations,
          consultationLanguages: Array.isArray(payload.doctor_languages)
            ? payload.doctor_languages
                .map((item: { language_name?: string }) => item.language_name)
                .filter((value): value is string => Boolean(value))
            : cachedProfile.consultationLanguages,
          verificationStatus: payload.verification_status === 'verified' ? 'verified' as const : 'unverified' as const,
        }
        saveDoctorProfile(profilePatch)
        setFullName((profilePatch.fullName ?? '').replace(/^Dr\.\s*/i, '') || 'Sarah Kumar')
        setEmail(profilePatch.email ?? 'doctor@astikan.com')
        setMobile(profilePatch.mobile ?? '')
        setPracticeAddress(profilePatch.practiceAddress ?? 'Astikan OPD Clinic, Connaught Place, New Delhi')
        setShortBio(profilePatch.shortBio ?? shortBio)
      })
      .catch(() => {
        // Keep cached profile as fallback.
      })

    return () => {
      active = false
    }
  }, [cachedProfile.userId])

  const profile = getDoctorProfile()
  const displayName = `Dr. ${fullName.trim() || 'Sarah Kumar'}`
  const isVerified = profile.verificationStatus === 'verified'
  const rating = 4.9
  const reviews = 128

  const practiceModes = useMemo(() => {
    if (!profile.availabilityMode) return 'Not set'
    return [
      profile.availabilityMode.virtual ? 'Virtual' : null,
      profile.availabilityMode.physical ? 'Physical' : null,
    ]
      .filter(Boolean)
      .join(' • ')
  }, [profile.availabilityMode])

  async function onSave() {
    const next = saveDoctorProfile({
      fullName: displayName,
      email: email.trim(),
      mobile: mobile.trim(),
      practiceAddress: practiceAddress.trim(),
      shortBio: shortBio.trim(),
    })

    if (next.userId) {
      try {
        await saveDoctorProfileRemote(next.userId, {
          fullName: next.fullName,
          email: next.email,
          phone: next.mobile,
          fullDisplayName: next.fullName,
          mobile: next.mobile,
          shortBio: next.shortBio,
          practiceAddress: next.practiceAddress,
          highestQualification: next.highestQualification,
          experienceYears: next.experienceYears,
          medicalCouncilNumber: next.medicalCouncilNumber,
          governmentIdNumber: next.governmentIdNumber,
          verificationStatus: 'submitted',
          specializations: (next.specializations ?? []).map((name) => ({
            code: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            name,
          })),
          languages: (next.consultationLanguages ?? []).map((name) => ({
            code: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            name,
          })),
        })
      } catch {
        // Keep local save even if remote save is temporarily unavailable.
      }
    }

    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  function handleLogout() {
    clearDoctorSession()
    clearDoctorProfile()
    onNavigate('login')
  }

  return (
    <section className="profile-page">
      <header className="mobile-topbar profile-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}>
          <AppIcon name="arrow-left" className="bar-svg" />
        </button>
        <h1>My Profile</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="notifications" onClick={() => onNavigate('notifications')}>
            <AppIcon name="bell" className="bar-svg" />
            <span className="dot">3</span>
          </button>
        </div>
      </header>

      <main className="profile-content">
        <section className="profile-hero-card card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <div className="profile-avatar-shell">
            <div className="profile-avatar-image" aria-hidden="true">
              {displayName.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase()}
            </div>
            {isVerified ? <span className="verified-pill">Astikan Verified</span> : <span className="pending-pill">Verification Pending</span>}
          </div>
          <div className="profile-hero-copy">
            <h2>{displayName}</h2>
            <p>{profile.specializations?.join(', ') ?? 'General Physician'}</p>
            <div className="profile-hero-metrics">
              <span><AppIcon name="sparkles" className="tiny" /> {rating} rating</span>
              <span><AppIcon name="patients" className="tiny" /> {reviews} patient reviews</span>
            </div>
          </div>
        </section>

        <section className="profile-grid card-rise" style={{ '--d': '35ms' } as CSSProperties}>
          <article className="profile-stat-card">
            <strong>{profile.experienceYears ?? 0} yrs</strong>
            <span>Experience</span>
          </article>
          <article className="profile-stat-card">
            <strong>{profile.consultationLanguages?.length ?? 0}</strong>
            <span>Languages</span>
          </article>
          <article className="profile-stat-card">
            <strong>{isVerified ? 'Live' : 'Pending'}</strong>
            <span>Profile State</span>
          </article>
        </section>

        <section className="profile-card card-rise" style={{ '--d': '70ms' } as CSSProperties}>
          <div className="section-head">
            <h3>Personal Information</h3>
            {saved ? <span className="saved-pill">Saved</span> : null}
          </div>
          <div className="form-grid">
            <label>
              Full Name
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter full name" />
            </label>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="doctor@astikan.com" />
            </label>
            <label>
              Mobile Number
              <input value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="10 digit mobile" />
            </label>
            <label>
              Practice Address
              <input value={practiceAddress} onChange={(event) => setPracticeAddress(event.target.value)} placeholder="Clinic or hospital address" />
            </label>
          </div>
        </section>

        <section className="profile-card card-rise" style={{ '--d': '105ms' } as CSSProperties}>
          <h3>Professional Details</h3>
          <div className="profile-detail-list">
            <article><span>Qualification</span><strong>{profile.highestQualification ?? 'Not added'}</strong></article>
            <article><span>Specializations</span><strong>{profile.specializations?.join(', ') ?? 'Not added'}</strong></article>
            <article><span>Consultation Languages</span><strong>{profile.consultationLanguages?.join(', ') ?? 'Not added'}</strong></article>
            <article><span>Practice Mode</span><strong>{practiceModes}</strong></article>
            <article><span>OPD Days</span><strong>{profile.opdDays?.join(', ') ?? 'Not added'}</strong></article>
            <article><span>OPD Timings</span><strong>{profile.opdTiming ? `${profile.opdTiming.from} - ${profile.opdTiming.to}` : 'Not added'}</strong></article>
            <article><span>Teleconsult Slots</span><strong>{profile.teleconsultSlots?.slice(0, 3).join(', ') ?? 'Not added'}</strong></article>
            <article><span>Medical Council No.</span><strong>{profile.medicalCouncilNumber ?? 'Not added'}</strong></article>
          </div>
        </section>

        <section className="profile-card card-rise" style={{ '--d': '140ms' } as CSSProperties}>
          <h3>Verification Documents</h3>
          <div className="profile-detail-list">
            <article><span>Government ID</span><strong>{profile.governmentIdFileName ?? 'Not uploaded'}</strong></article>
            <article><span>License Certificate</span><strong>{profile.licenseFileName ?? 'Not uploaded'}</strong></article>
            <article><span>Verification Status</span><strong>{isVerified ? 'Astikan Verified' : 'Review in progress'}</strong></article>
          </div>
        </section>

        <section className="profile-card card-rise" style={{ '--d': '175ms' } as CSSProperties}>
          <h3>Profile Bio</h3>
          <textarea value={shortBio} onChange={(event) => setShortBio(event.target.value)} rows={4} />
          <p className="profile-note">
            {isVerified
              ? 'Your verified profile is visible in appointments, patient discovery, and corporate care panels.'
              : 'You can access the dashboard, but consultation capabilities remain restricted until Astikan verification is complete.'}
          </p>
        </section>

        <section className="profile-actions card-rise" style={{ '--d': '210ms' } as CSSProperties}>
          <button type="button" className="ghost-btn" onClick={() => onNavigate('notifications')}>View Alerts</button>
          <button type="button" className="ghost-btn" onClick={handleLogout}>Logout</button>
          <button type="button" className="primary-btn" onClick={onSave}>Save Profile</button>
        </section>
      </main>

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

export default Settings
