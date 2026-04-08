import { apiGet, apiPost } from './api'

export type PharmacyProduct = {
  id: string
  sku?: string | null
  name: string
  category?: string | null
  description?: string | null
  base_price_inr: number
  image_urls_json?: string[]
  available_qty?: number | null
  in_stock?: boolean
}

export async function fetchPharmacyProducts(query?: { search?: string; category?: string; limit?: number; audience?: 'employee' | 'doctor' }) {
  const params = new URLSearchParams()
  if (query?.search) params.set('search', query.search)
  if (query?.category) params.set('category', query.category)
  if (query?.limit) params.set('limit', String(query.limit))
  if (query?.audience) params.set('audience', query.audience)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiGet<PharmacyProduct[]>(`/pharmacy/products${suffix}`)
}

export async function createPharmacyOrder(input: {
  companyReference?: string
  companyName?: string
  doctor?: { email?: string; phone?: string; fullName?: string; handle?: string }
  employee?: { email?: string; phone?: string; fullName?: string; handle?: string; employeeCode?: string }
  patientId?: string
  orderSource: 'doctor_store' | 'employee_store' | 'admin_panel'
  subtotalInr: number
  walletUsedInr?: number
  onlinePaymentInr?: number
  creditCost?: number
  shippingAddress?: Record<string, unknown>
  items: Array<{
    sku?: string
    productId?: string
    name: string
    category?: string
    description?: string
    price: number
    quantity: number
    imageUrls?: string[]
  }>
}) {
  return apiPost<{ orderId: string; companyId: string }, typeof input>('/pharmacy/orders', input)
}
