import { apiGet } from './api'

export type AppointmentRecord = {
  id: string
  company_id: string
  employee_id?: string | null
  patient_id?: string | null
  doctor_id: string
  appointment_type: 'teleconsult' | 'opd'
  scheduled_start: string
  scheduled_end: string
  status: 'scheduled' | 'confirmed' | 'underway' | 'completed' | 'rescheduled' | 'cancelled' | 'no_show'
  reason?: string | null
  patient_summary?: string | null
  symptom_snapshot_json?: Record<string, unknown>
  ai_triage_summary?: string | null
  employee_name?: string | null
  employee_avatar_url?: string | null
  patient_name?: string | null
  patient_avatar_url?: string | null
  opd_visits?: Array<{ patient_eta_minutes?: number | null; clinic_location?: string | null; status?: string | null }>
  teleconsult_sessions?: Array<{
    id: string
    company_id?: string | null
    employee_id?: string | null
    doctor_id?: string | null
    scheduled_at?: string | null
    status?: string | null
  }>
}

export async function fetchAppointments(query: {
  companyId?: string
  doctorId?: string
  employeeId?: string
  patientId?: string
  status?: string
  appointmentType?: 'teleconsult' | 'opd'
  limit?: number
}) {
  const params = new URLSearchParams()
  if (query.companyId) params.set('companyId', query.companyId)
  if (query.doctorId) params.set('doctorId', query.doctorId)
  if (query.employeeId) params.set('employeeId', query.employeeId)
  if (query.patientId) params.set('patientId', query.patientId)
  if (query.status) params.set('status', query.status)
  if (query.appointmentType) params.set('appointmentType', query.appointmentType)
  if (query.limit) params.set('limit', String(query.limit))
  return apiGet<AppointmentRecord[]>(`/appointments?${params.toString()}`)
}
