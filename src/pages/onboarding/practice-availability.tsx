import { useMemo, useState } from "react"
import type { AppRoute } from "../../types/routes"
import {
  saveDoctorAvailability,
  saveDoctorProfileRemote,
  updateDoctorVerification,
} from "../../services/doctorApi"
import { getDoctorProfile, saveDoctorProfile } from "../../utils/doctorProfile"
import "./onboarding.css"

type PracticeAvailabilityProps = {
  onNavigate: (route: AppRoute) => void
}

const DAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function normalizeTime(value: string) {
  const [rawTime, meridiem] = value.split(' ')
  const [rawHours, rawMinutes] = rawTime.split(':').map(Number)
  let hours = rawHours
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${String(rawMinutes).padStart(2, '0')}:00`
}

function PracticeAvailability({ onNavigate }: PracticeAvailabilityProps) {
  const [practiceAddress, setPracticeAddress] = useState("")
  const [virtualAvailable, setVirtualAvailable] = useState(true)
  const [physicalAvailable, setPhysicalAvailable] = useState(true)
  const [selectedOpdDays, setSelectedOpdDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [opdFrom, setOpdFrom] = useState("10:00 AM")
  const [opdTo, setOpdTo] = useState("06:00 PM")
  const [selectedTeleSlots, setSelectedTeleSlots] = useState<string[]>(["09:00 AM - 09:30 AM", "07:00 PM - 07:30 PM"])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const days = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], [])
  const timeOptions = useMemo(
    () => [
      "08:00 AM",
      "08:30 AM",
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
      "05:00 PM",
      "05:30 PM",
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
      "07:30 PM",
      "08:00 PM",
      "08:30 PM",
    ],
    [],
  )
  const teleSlots = useMemo(
    () => [
      "09:00 AM - 09:30 AM",
      "09:30 AM - 10:00 AM",
      "10:00 AM - 10:30 AM",
      "10:30 AM - 11:00 AM",
      "11:00 AM - 11:30 AM",
      "11:30 AM - 12:00 PM",
      "05:00 PM - 05:30 PM",
      "05:30 PM - 06:00 PM",
      "06:00 PM - 06:30 PM",
      "06:30 PM - 07:00 PM",
      "07:00 PM - 07:30 PM",
      "07:30 PM - 08:00 PM",
    ],
    [],
  )

  function toggleOpdDay(day: string) {
    setSelectedOpdDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]))
  }

  function toggleTeleSlot(slot: string) {
    setSelectedTeleSlots((prev) => (prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot]))
  }

  async function handleSubmitProfile() {
    if (!practiceAddress.trim()) {
      setError("Enter primary practice address.")
      return
    }
    if (!virtualAvailable && !physicalAvailable) {
      setError("Select at least one availability mode (Virtual or Physical).")
      return
    }
    if (selectedOpdDays.length === 0) {
      setError("Select OPD days.")
      return
    }
    if (selectedTeleSlots.length === 0) {
      setError("Select at least one teleconsultation 30-min slot.")
      return
    }

    const profile = getDoctorProfile()
    if (!profile.userId) {
      setError('Doctor profile is not initialized. Start again from registration.')
      return
    }

    setError("")
    setSubmitting(true)
    try {
      const specializations = (profile.specializations ?? []).map((name) => ({
        code: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        name,
      }))
      const languages = (profile.consultationLanguages ?? []).map((name) => ({
        code: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        name,
      }))

      await saveDoctorProfileRemote(profile.userId, {
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.mobile,
        fullDisplayName: profile.fullName,
        mobile: profile.mobile,
        shortBio: profile.shortBio,
        highestQualification: profile.highestQualification,
        experienceYears: profile.experienceYears,
        medicalCouncilNumber: profile.medicalCouncilNumber,
        governmentIdNumber: profile.governmentIdNumber,
        practiceAddress: practiceAddress.trim(),
        consultationFeeInr: 0,
        verificationStatus: 'submitted',
        specializations,
        languages,
      })

      const slots = [
        ...(virtualAvailable
          ? selectedTeleSlots.map((slot) => {
              const [start, end] = slot.split(' - ')
              return {
                availabilityType: 'virtual' as const,
                dayOfWeek: 1,
                startTime: normalizeTime(start),
                endTime: normalizeTime(end),
                slotMinutes: 30,
                locationLabel: 'Teleconsultation',
                isActive: true,
              }
            })
          : []),
        ...(physicalAvailable
          ? selectedOpdDays.map((day) => ({
              availabilityType: 'physical' as const,
              dayOfWeek: DAY_TO_INDEX[day],
              startTime: normalizeTime(opdFrom),
              endTime: normalizeTime(opdTo),
              slotMinutes: 30,
              locationLabel: practiceAddress.trim(),
              isActive: true,
            }))
          : []),
      ]

      await saveDoctorAvailability(profile.userId, { slots })

      await updateDoctorVerification(profile.userId, {
        verificationStatus: 'submitted',
        documentIds: [profile.governmentIdDocumentId, profile.licenseDocumentId].filter(Boolean) as string[],
      })

      saveDoctorProfile({
        practiceAddress: practiceAddress.trim(),
        availabilityMode: { virtual: virtualAvailable, physical: physicalAvailable },
        opdDays: selectedOpdDays,
        opdTiming: { from: opdFrom, to: opdTo },
        teleconsultSlots: selectedTeleSlots,
        verificationStatus: 'unverified',
        submittedAt: new Date().toISOString(),
      })
      onNavigate("verification-pending")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit doctor profile right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="onboard-page">
      <div className="onboard-shell">
        <header className="onboard-brand-banner">
          <span className="onboard-chip">Step 4 of 4</span>
          <div>
            <h1>Practice & Availability</h1>
            <p>Configure OPD and teleconsult slots for bookings.</p>
          </div>
          <div className="onboard-steps">
            <span className="onboard-step active" />
            <span className="onboard-step active" />
            <span className="onboard-step active" />
            <span className="onboard-step active" />
          </div>
        </header>

        <section className="onboard-card onboard-form">
          <h2 className="onboard-title">Practice Availability</h2>
          <p className="onboard-subtitle">Finalize schedule before profile submission</p>
          <label>
            Primary Practice Address
            <textarea className="onboard-input" placeholder="Clinic/Hospital address" value={practiceAddress} onChange={(event) => setPracticeAddress(event.target.value)} />
          </label>
          <label>
            Availability Mode
            <div className="onboard-chip-row">
              <button type="button" className={`onboard-option ${virtualAvailable ? "active" : ""}`} onClick={() => setVirtualAvailable((prev) => !prev)}>Virtual</button>
              <button type="button" className={`onboard-option ${physicalAvailable ? "active" : ""}`} onClick={() => setPhysicalAvailable((prev) => !prev)}>Physical</button>
            </div>
          </label>
          <label>
            OPD Days
            <div className="onboard-chip-row">
              {days.map((day) => (
                <button key={day} type="button" className={`onboard-option ${selectedOpdDays.includes(day) ? "active" : ""}`} onClick={() => toggleOpdDay(day)}>
                  {day}
                </button>
              ))}
            </div>
          </label>
          <label>
            OPD Timings
            <div className="onboard-inline-grid">
              <select className="onboard-input" value={opdFrom} onChange={(event) => setOpdFrom(event.target.value)}>
                {timeOptions.map((time) => (
                  <option key={`from-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <select className="onboard-input" value={opdTo} onChange={(event) => setOpdTo(event.target.value)}>
                {timeOptions.map((time) => (
                  <option key={`to-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Teleconsultation Slots (30 mins)
            <div className="onboard-slot-grid">
              {teleSlots.map((slot) => (
                <button key={slot} type="button" className={`onboard-option ${selectedTeleSlots.includes(slot) ? "active" : ""}`} onClick={() => toggleTeleSlot(slot)}>
                  {slot}
                </button>
              ))}
            </div>
          </label>
          <p className="onboard-note">Profile will remain pending until super admin approval.</p>
          {error ? <p className="onboard-error-block">{error}</p> : null}

          <div className="onboard-actions">
            <button type="button" className="onboard-btn" onClick={() => onNavigate("professional-details")}>Back</button>
            <button type="button" className="onboard-btn primary" onClick={handleSubmitProfile} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Profile'}
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default PracticeAvailability
