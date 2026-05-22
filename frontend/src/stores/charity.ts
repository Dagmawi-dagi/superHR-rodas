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
  comments: { commentId: number; commentedBy: number; commentedAt: string; text: string }[]
  description?: string
  donationDeliveryDate?: string // DATEONLY
  createdBy?: number
  created_at?: string
  updated_at?: string
  // Associations
  team?: CharityTeam
  items?: CharityDonationItem[]
  creator?: { userId: number; fullName: string }
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
  async getBeneficiaries(params?: { search?: string; type?: string; isActive?: boolean; teamId?: number; page?: number; size?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)             q.set('search', params.search)
      if (params?.type)               q.set('type', params.type)
      if (params?.teamId)             q.set('teamId', String(params.teamId))
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
      if (params?.page)               q.set('page', String(params.page))
      if (params?.size)               q.set('size', String(params.size))
      const r = await api.get(`/charity/beneficiaries${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getBeneficiariesByTeam(teamId: number) {
    // Fetch all active beneficiaries for a team (large size to avoid pagination cut-off)
    return this.getBeneficiaries({ teamId, isActive: true, size: 200 })
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
  async getDonations(params?: { status?: string; teamId?: number; page?: number; size?: number; fromDate?: string; toDate?: string }) {
    try {
      const q = new URLSearchParams()
      if (params?.status)   q.set('status', params.status)
      if (params?.teamId)   q.set('teamId', String(params.teamId))
      if (params?.page)     q.set('page', String(params.page))
      if (params?.size)     q.set('size', String(params.size))
      if (params?.fromDate) q.set('fromDate', params.fromDate)
      if (params?.toDate)   q.set('toDate', params.toDate)
      const r = await api.get(`/charity/donations${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationById(id: number | string) {
    try { const r = await api.get(`/charity/donations/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createDonation(data: any) {
    try { const r = await api.post('/charity/donations', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDonation(id: number, data: any) {
    try { const r = await api.put(`/charity/donations/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async submitDonation(id: number) {
    try { const r = await api.post(`/charity/donations/${id}/submit`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async approveDonation(id: number) {
    try { const r = await api.post(`/charity/donations/${id}/approve`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async commentDonation(id: number, text: string) {
    try { const r = await api.post(`/charity/donations/${id}/comment`, { text }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async cancelDonation(id: number) {
    try { const r = await api.post(`/charity/donations/${id}/cancel`); return r.data }
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
  async deleteDonationItem(itemId: number) {
    try { const r = await api.delete(`/charity/donations/items/${itemId}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async markItemDelivered(itemId: number) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/deliver`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async returnItem(itemId: number, reason: string) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/return`, { reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Approvals / Requests ──────────────────────────────────────────────────
  async getRequests(params?: { status?: string; action?: string; page?: number; size?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.action) q.set('action', params.action)
      if (params?.page)   q.set('page', String(params.page))
      if (params?.size)   q.set('size', String(params.size))
      const r = await api.get(`/charity/requests${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getRequestById(id: number) {
    try { const r = await api.get(`/charity/requests/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async approveRequest(id: number) {
    try { const r = await api.post(`/charity/requests/${id}/approve`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async rejectRequest(id: number, reason?: string) {
    try { const r = await api.post(`/charity/requests/${id}/reject`, { reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async commentRequest(id: number, text: string) {
    try { const r = await api.post(`/charity/requests/${id}/comment`, { text }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async submitAdjustment(data: { action: string; donationItemId: number; recurringIntervalId?: number; reason?: string }) {
    try { const r = await api.post('/charity/requests/adjustment', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  async getSettings() {
    try { const r = await api.get('/charity/settings'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateSettings(data: Partial<Pick<CharitySetting, 'companies' | 'config'>>) {
    try { const r = await api.put('/charity/settings', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async addCompany(data: { name: string; fullInfo?: Record<string, any> }) {
    try { const r = await api.post('/charity/settings/companies', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateCompany(index: number, data: { name?: string; fullInfo?: Record<string, any> }) {
    try { const r = await api.put(`/charity/settings/companies/${index}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteCompany(index: number) {
    try { const r = await api.delete(`/charity/settings/companies/${index}`); return r.data }
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
