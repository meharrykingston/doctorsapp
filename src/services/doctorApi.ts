import { apiGet, apiPost, apiPut } from './api'

export type DoctorRecord = {
  user_id: string
  doctor_code?: string
  full_display_name?: string
  full_name?: string
  email?: string
  mobile?: string
  avatar_url?: string | null
  short_bio?: string
  highest_qualification?: string
  experience_years?: number
  medical_council_number?: string
  government_id_number?: string
  practice_address?: string
  consultation_fee_inr?: number
  rating_avg?: number
  rating_count?: number
  verification_status?: string
  doctor_specializations?: Array<{ specialization_code?: string; specialization_name?: string }>
  doctor_languages?: Array<{ language_code?: string; language_name?: string }>
  doctor_availability?: Array<{
    availability_type?: 'virtual' | 'physical'
    day_of_week?: number
    start_time?: string
    end_time?: string
    location_label?: string | null
  }>
  doctor_verification_documents?: Array<{ id: string }>
}

export type DoctorBootstrapResponse = {
  userId: string
  email: string
  fullName: string
}

export type DoctorProfilePayload = {
  fullName?: string
  email?: string
  phone?: string
  fullDisplayName?: string
  mobile?: string
  shortBio?: string
  highestQualification?: string
  experienceYears?: number
  medicalCouncilNumber?: string
  governmentIdNumber?: string
  practiceAddress?: string
  consultationFeeInr?: number
  verificationStatus?: string
  specializations?: Array<{ code: string; name: string }>
  languages?: Array<{ code: string; name: string }>
}

export type DoctorAvailabilityPayload = {
  slots: Array<{
    availabilityType: 'virtual' | 'physical'
    dayOfWeek: number
    startTime: string
    endTime: string
    slotMinutes?: number
    locationLabel?: string
    isActive?: boolean
  }>
}

export type DoctorDocumentPayload = {
  documentType: 'government_id' | 'license_certificate' | 'other_certificate' | 'profile_photo'
  fileName: string
  mimeType: string
  storageKey?: string
  fileSizeBytes?: number
  fileBase64?: string
}

export async function bootstrapDoctor(input: {
  email?: string
  phone?: string
  fullName?: string
  handle?: string
  specialization?: string
}) {
  return apiPost<DoctorBootstrapResponse, typeof input>('/doctors/bootstrap', input)
}

export async function fetchDoctors(query?: { search?: string; specialization?: string; verificationStatus?: string; limit?: number }) {
  const params = new URLSearchParams()
  if (query?.search) params.set('search', query.search)
  if (query?.specialization) params.set('specialization', query.specialization)
  if (query?.verificationStatus) params.set('verificationStatus', query.verificationStatus)
  if (query?.limit) params.set('limit', String(query.limit))
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiGet<DoctorRecord[]>(`/doctors${suffix}`)
}

export async function fetchDoctorProfile(userId: string) {
  return apiGet<DoctorRecord | null>(`/doctors/${userId}`)
}

export async function saveDoctorProfileRemote(userId: string, payload: DoctorProfilePayload) {
  return apiPut<{ userId: string }, DoctorProfilePayload>(`/doctors/${userId}/profile`, payload)
}

export async function saveDoctorAvailability(userId: string, payload: DoctorAvailabilityPayload) {
  return apiPut<{ userId: string; slots: number }, DoctorAvailabilityPayload>(`/doctors/${userId}/availability`, payload)
}

export async function createDoctorDocument(userId: string, payload: DoctorDocumentPayload) {
  return apiPost<{ documentId: string; storageKey: string }, DoctorDocumentPayload>(`/doctors/${userId}/documents`, payload)
}

export async function updateDoctorVerification(userId: string, payload: {
  verificationStatus: 'verified' | 'rejected' | 'in_review' | 'submitted'
  reviewedBy?: string
  reviewNotes?: string
  documentIds?: string[]
}) {
  return apiPost<{ userId: string; verificationStatus: string }, typeof payload>(`/doctors/${userId}/verify`, payload)
}
