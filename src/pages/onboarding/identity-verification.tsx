import { useState, type ChangeEvent } from "react"
import type { AppRoute } from "../../types/routes"
import { createDoctorDocument } from "../../services/doctorApi"
import { getDoctorProfile, saveDoctorProfile } from "../../utils/doctorProfile"
import "./onboarding.css"

type IdentityVerificationProps = {
  onNavigate: (route: AppRoute) => void
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })
}

function IdentityVerification({ onNavigate }: IdentityVerificationProps) {
  const [medicalCouncilNumber, setMedicalCouncilNumber] = useState("")
  const [governmentIdNumber, setGovernmentIdNumber] = useState("")
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)

  function isAllowedDocument(file: File) {
    const lower = file.name.toLowerCase()
    const hasAllowedExt = lower.endsWith(".pdf") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")
    const hasAllowedType =
      file.type === "application/pdf" ||
      file.type === "image/png" ||
      file.type === "image/jpeg"
    return hasAllowedExt || hasAllowedType
  }

  function handleGovernmentIdUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    if (!isAllowedDocument(file)) {
      setError("Government ID must be image or PDF.")
      return
    }
    setError("")
    setGovernmentIdFile(file)
  }

  function handleLicenseUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    if (!isAllowedDocument(file)) {
      setError("License certificate must be image or PDF.")
      return
    }
    setError("")
    setLicenseFile(file)
  }

  async function handleContinue() {
    if (!medicalCouncilNumber.trim()) {
      setError("Medical council number is required.")
      return
    }
    if (!governmentIdNumber.trim()) {
      setError("Government ID number is required.")
      return
    }
    if (!governmentIdFile || !licenseFile) {
      setError("Both uploads are mandatory: Government ID and License certificate.")
      return
    }

    const profile = getDoctorProfile()
    if (!profile.userId) {
      setError('Doctor profile is not initialized. Start again from registration.')
      return
    }

    setError("")
    setUploading(true)
    try {
      const [governmentIdBase64, licenseBase64] = await Promise.all([
        fileToBase64(governmentIdFile),
        fileToBase64(licenseFile),
      ])

      const [governmentDoc, licenseDoc] = await Promise.all([
        createDoctorDocument(profile.userId, {
          documentType: 'government_id',
          fileName: governmentIdFile.name,
          mimeType: governmentIdFile.type || 'application/octet-stream',
          fileSizeBytes: governmentIdFile.size,
          fileBase64: governmentIdBase64,
        }),
        createDoctorDocument(profile.userId, {
          documentType: 'license_certificate',
          fileName: licenseFile.name,
          mimeType: licenseFile.type || 'application/octet-stream',
          fileSizeBytes: licenseFile.size,
          fileBase64: licenseBase64,
        }),
      ])

      saveDoctorProfile({
        medicalCouncilNumber: medicalCouncilNumber.trim(),
        governmentIdNumber: governmentIdNumber.trim(),
        governmentIdFileName: governmentIdFile.name,
        governmentIdMimeType: governmentIdFile.type || 'application/octet-stream',
        governmentIdStorageKey: governmentDoc.storageKey,
        governmentIdDocumentId: governmentDoc.documentId,
        licenseFileName: licenseFile.name,
        licenseMimeType: licenseFile.type || 'application/octet-stream',
        licenseStorageKey: licenseDoc.storageKey,
        licenseDocumentId: licenseDoc.documentId,
        verificationStatus: "unverified",
      })
      onNavigate("professional-details")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload verification documents right now.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="onboard-page">
      <div className="onboard-shell">
        <header className="onboard-brand-banner">
          <span className="onboard-chip">Step 2 of 4</span>
          <div>
            <h1>Identity & Verification</h1>
            <p>KYC and medical license verification setup.</p>
          </div>
          <div className="onboard-steps">
            <span className="onboard-step active" />
            <span className="onboard-step active" />
            <span className="onboard-step" />
            <span className="onboard-step" />
          </div>
        </header>

        <section className="onboard-card onboard-form">
          <h2 className="onboard-title">Verification Documents</h2>
          <p className="onboard-subtitle">Use valid numbers to avoid onboarding delays</p>
          <label>
            Medical Council Number
            <input className="onboard-input" type="text" placeholder="MCI / State License ID" value={medicalCouncilNumber} onChange={(event) => setMedicalCouncilNumber(event.target.value)} />
          </label>
          <label>
            Government ID Number (Any one)
            <input className="onboard-input" type="text" placeholder="Aadhaar / Passport / PAN" value={governmentIdNumber} onChange={(event) => setGovernmentIdNumber(event.target.value)} />
          </label>
          <label>
            Upload Government ID (Image/PDF)
            <input className="onboard-input" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={handleGovernmentIdUpload} />
          </label>
          {governmentIdFile ? <p className="onboard-note">Government ID uploaded: {governmentIdFile.name}</p> : null}
          <label>
            Upload License Certificate (Image/PDF)
            <input className="onboard-input" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={handleLicenseUpload} />
          </label>
          {licenseFile ? <p className="onboard-note">License certificate uploaded: {licenseFile.name}</p> : null}
          <p className="onboard-note">Verification is required before super admin approval for live consultations.</p>
          {error ? <p className="onboard-error-block">{error}</p> : null}

          <div className="onboard-actions">
            <button type="button" className="onboard-btn" onClick={() => onNavigate("registration")}>Back</button>
            <button type="button" className="onboard-btn primary" onClick={() => void handleContinue()} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Continue'}
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default IdentityVerification
