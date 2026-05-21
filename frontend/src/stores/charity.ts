// stores/charity.ts  — Strictly synchronized with Backend Migration #18
import api from './interceptor'
import EmployeesService from './employee'

// ============================================================================
// TYPES
// ============================================================================

/** CharityTeam Model */
export interface CharityTeam {
  teamId: number
  name: string
  description?: string
  headEmployeeId?: number
  viceEmployeeId?: number
  members: number[]             // JSONB: array of employee_ids
  isActive: boolean
  createdBy?: number
  created_at?: string
  updated_at?: string
  // Associations (populated by backend)
  head?: { employeeId: number; firstName: string; lastName: string }
  vice?: { employeeId: number; firstName: string; lastName: string }
  creator?: { userId: number; full_name: string }
  beneficiaries?: CharityBeneficiary[]
}

/** CharityBeneficiary Model */
export interface CharityBeneficiary {
  beneficiaryId: number
  name: string
  type: 'individual' | 'organization'
  fullInfo: {
    location?: { region: string; city: string; woreda: string }
    contact?: { phone?: string; email?: string; contactPerson?: string }
    [key: string]: any
  }
  teamId?: number
  isActive: boolean
  createdBy?: number
  created_at?: string
  updated_at?: string
  // Associations
  team?: CharityTeam
}

/** CharityDonation Model (Header) */
export interface CharityDonation {
  donationId: number
  teamId?: number
  totalValueInBirr: number
  status: 'draft' | 'pending' | 'approved' | 'cancelled'
  description?: string
  donationDeliveryDate?: string // DATEONLY
  createdBy?: number
  created_at?: string
  updated_at?: string
  // Associations
  team?: CharityTeam
  items?: CharityDonationItem[]
}

/** CharityDonationItem Model (Line Item) */
export interface CharityDonationItem {
  donationItemId: number
  donationId: number
  beneficiaryId: number
  type: 'money' | 'goods' | 'service'
  description?: string
  quantity?: number
  unitValueInBirr?: number
  totalValueInBirr?: number
  paymentMethod: 'bank' | 'cash'
  // JSONB: Recurring Schedule
  isRecurring: null | {
    recurring_type: 'monthly' | 'weekly' | 'daily'
    recurring_count: number
    recurrings: {
      recurring_id: number
      quantity: number
      unit_value_in_birr: number
      total_value_in_birr: number
      payment_method: 'bank' | 'cash'
      is_delivered: boolean
      is_returned: null | { reason: string }
    }[]
  }
  // JSONB: Return Reason
  isReturned: null | { reason: string }
  isDelivered: boolean
  bankReceipts: string[]        // JSONB: array of file URLs
  // JSONB: Adjustment Pointer
  onAdjustment: null | { 
    adjustment_id: number
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'commented' 
  }
  createdBy?: number
  created_at?: string
  updated_at?: string
  // Associations
  beneficiary?: CharityBeneficiary
  donation?: CharityDonation
}

/** CharityRequestApprove Model (Workflow) */
export interface CharityRequestApprove {
  requestId: number
  userId?: number               // Assigned admin
  action: 'NewBeneficiary' | 'NewCharityTeam' | 'TransferBeneficiary' | 'Deduct' | 'Increase' | 'Transfer' | 'Return'
  requestedBy: number           // Team Leader user_id
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'commented'
  approvedBy?: number
  rejectedBy?: number
  reviewedAt?: string
  comments: { user_id: number; text: string; created_at: string }[]
  metadata: {
    beneficiary_id?: number
    charity_team_id?: number
    donation_item_id?: number
    recurring_interval_id?: number
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
  // Associations
  requester?: { userId: number; full_name: string; employee?: any }
  assignedAdmin?: { userId: number; full_name: string }
}

/** CharitySetting Model */
export interface CharitySetting {
  settingId: number
  settingKey: string            // 'main', etc.
  companies: { 
    name: string
    full_info: { type: string; phone: string; email: string; address: string }
  }[]
  config: Record<string, any>
  updatedBy?: number
  created_at?: string
  updated_at?: string
}

// ============================================================================
// SERVICE
// ============================================================================

class CharityService {

  // ── Teams ──────────────────────────────────────────────────────────────────
  async getTeams() {
    try { const r = await api.get('/charity/teams'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getTeamById(id: number | string) {
    try { const r = await api.get(`/charity/teams/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createTeam(data: Partial<CharityTeam>) {
    try { const r = await api.post('/charity/teams', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateTeam(id: number, data: Partial<CharityTeam>) {
    try { const r = await api.put(`/charity/teams/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteTeam(id: number) {
    try { const r = await api.delete(`/charity/teams/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Beneficiaries ──────────────────────────────────────────────────────────
  async getBeneficiaries(params?: { search?: string; type?: string; teamId?: number; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.type)   q.set('type', params.type)
      if (params?.teamId) q.set('teamId', String(params.teamId))
      if (params?.page)   q.set('page', String(params.page))
      if (params?.limit)  q.set('limit', String(params.limit))
      const r = await api.get(`/charity/beneficiaries${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getBeneficiariesByTeam(teamId: number) {
    return this.getBeneficiaries({ teamId })
  }
  async getBeneficiaryById(id: number | string) {
    try { const r = await api.get(`/charity/beneficiaries/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createBeneficiary(data: Partial<CharityBeneficiary>) {
    try { const r = await api.post('/charity/beneficiaries', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateBeneficiary(id: number | string, data: Partial<CharityBeneficiary>) {
    try { const r = await api.put(`/charity/beneficiaries/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Donations ──────────────────────────────────────────────────────────────
  async getDonations(params?: { status?: string; teamId?: number; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.teamId) q.set('teamId', String(params.teamId))
      if (params?.page)   q.set('page', String(params.page))
      if (params?.limit)  q.set('limit', String(params.limit))
      const r = await api.get(`/charity/donations${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationById(id: number | string) {
    try { const r = await api.get(`/charity/donations/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createDonation(data: Partial<CharityDonation>) {
    try { const r = await api.post('/charity/donations', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDonation(id: number, data: Partial<CharityDonation>) {
    try { const r = await api.put(`/charity/donations/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async addDonationItem(donationId: number, data: any) {
    try { const r = await api.post(`/charity/donations/${donationId}/items`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDonationItem(itemId: number, data: any) {
    try { const r = await api.put(`/charity/donations/items/${itemId}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Approvals (Adjustments) ────────────────────────────────────────────────
  async getAllApprovals() {
    try { const r = await api.get('/charity/approvals'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async reviewApproval(id: number, status: 'approved' | 'rejected', comment?: string) {
    try { const r = await api.post(`/charity/approvals/${id}/review`, { status, comment }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings() {
    try { const r = await api.get('/charity/settings/main'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateSettings(data: any) {
    try { const r = await api.put('/charity/settings/main', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Misc Helpers ──────────────────────────────────────────────────────────
  async getEmployeesForDropdown() {
    try {
      const res = await EmployeesService.getEmployees({ limit: 200, employmentStatus: 'active' })
      if (res.success) {
        return { success: true, data: res.data.map((e: any) => ({ id: e.id, fullName: e.fullName })) }
      }
      return { success: false, data: [], error: 'Failed to fetch employees' }
    } catch (e: any) { return { success: false, data: [], error: e.message } }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
  }
}

export default new CharityService()
