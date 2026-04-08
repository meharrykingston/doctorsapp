import { useMemo, useState } from "react"
import type { AppRoute } from "../../types/routes"
import { bootstrapDoctor } from "../../services/doctorApi"
import { saveDoctorProfile } from "../../utils/doctorProfile"
import "./onboarding.css"

type RegistrationProps = {
  onNavigate: (route: AppRoute) => void
}

function slug(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function DoctorRegistration({ onNavigate }: RegistrationProps) {
  const [nameInput, setNameInput] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [specializationPickerOpen, setSpecializationPickerOpen] = useState(false)
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const specializationOptions = useMemo(
    () => [
      "General Medicine",
      "Cardiology",
      "Dermatology",
      "Pediatrics",
      "Orthopedics",
      "Neurology",
      "ENT",
      "Gynecology",
      "Psychiatry",
      "Pulmonology",
      "Gastroenterology",
      "Nephrology",
      "Oncology",
      "Endocrinology",
      "Ophthalmology",
      "Urology",
      "Anesthesiology",
      "Emergency Medicine",
    ],
    [],
  )

  const fullNamePreview = nameInput.trim() ? `Dr. ${nameInput.trim().replace(/^dr\.?\s*/i, "")}` : "Dr. "

  function toggleSpecialization(value: string) {
    setSelectedSpecializations((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    )
  }

  async function handleContinue() {
    if (!nameInput.trim()) {
      setError("Enter full name.")
      return
    }
    if (!email.trim()) {
      setError("Enter email.")
      return
    }
    if (!/^\d{10}$/.test(mobile)) {
      setError("Mobile must be exactly 10 digits.")
      return
    }
    if (selectedSpecializations.length === 0) {
      setError("Select at least one specialization.")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      const doctor = await bootstrapDoctor({
        email: email.trim(),
        phone: mobile,
        fullName: fullNamePreview,
        handle: slug(nameInput || email),
        specialization: selectedSpecializations[0],
      })

      saveDoctorProfile({
        userId: doctor.userId,
        fullName: fullNamePreview,
        email: doctor.email,
        mobile,
        specializations: selectedSpecializations,
        verificationStatus: "unverified",
      })
      onNavigate("identity-verification")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create doctor profile right now.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="onboard-page">
      <div className="onboard-shell">
        <header className="onboard-brand-banner">
          <span className="onboard-chip">Step 1 of 4</span>
          <div>
            <h1>Doctor Registration</h1>
            <p>Basic account and specialization details.</p>
          </div>
          <div className="onboard-steps">
            <span className="onboard-step active" />
            <span className="onboard-step" />
            <span className="onboard-step" />
            <span className="onboard-step" />
          </div>
        </header>

        <section className="onboard-card onboard-form">
          <h2 className="onboard-title">Registration Details</h2>
          <p className="onboard-subtitle">Provide details exactly as per medical records</p>
          <label>
            Full Name
            <input
              className="onboard-input"
              type="text"
              placeholder="Enter your name"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
            <small className="onboard-inline-help">Auto prefix applied: {fullNamePreview}</small>
          </label>
          <label>
            Email
            <input className="onboard-input" type="email" placeholder="doctor@hospital.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Mobile
            <input
              className="onboard-input"
              type="tel"
              placeholder="10-digit mobile"
              value={mobile}
              maxLength={10}
              inputMode="numeric"
              onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </label>
          <label>
            Specializations
            <button type="button" className="onboard-picker-btn" onClick={() => setSpecializationPickerOpen(true)}>
              {selectedSpecializations.length > 0 ? `${selectedSpecializations.length} selected` : "Select specializations"}
            </button>
          </label>
          {selectedSpecializations.length > 0 ? (
            <div className="onboard-chip-row">
              {selectedSpecializations.map((specialization) => (
                <span className="onboard-tag" key={specialization}>{specialization}</span>
              ))}
            </div>
          ) : null}
          {error ? <p className="onboard-error-block">{error}</p> : null}

          <div className="onboard-actions">
            <button type="button" className="onboard-btn" onClick={() => onNavigate("login")}>Back</button>
            <button type="button" className="onboard-btn primary" onClick={handleContinue} disabled={submitting}>
              {submitting ? "Creating profile..." : "Continue"}
            </button>
          </div>
        </section>

        {specializationPickerOpen ? (
          <div className="onboard-modal-overlay" role="dialog" aria-modal="true">
            <section className="onboard-modal-card">
              <h3>Select Specializations</h3>
              <p>Choose all clinical areas you consult in.</p>
              <div className="onboard-options-grid">
                {specializationOptions.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`onboard-option ${selectedSpecializations.includes(option) ? "active" : ""}`}
                    onClick={() => toggleSpecialization(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="onboard-actions">
                <button type="button" className="onboard-btn" onClick={() => setSpecializationPickerOpen(false)}>Close</button>
                <button type="button" className="onboard-btn primary" onClick={() => setSpecializationPickerOpen(false)}>Done</button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default DoctorRegistration
