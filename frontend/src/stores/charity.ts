// stores/charity.ts  — v3
import api from './interceptor'
import EmployeesService from './employee'

// ============================================================================
// TYPES
// ============================================================================

export interface Company {
  companyId: number
  name: string
  type: 'main' | 'sister' | 'partner'
  contactInfo: Record<string, any>
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Campaign {
  campaignId: number
  title: string
  description?: string
  category?: string
  startDate?: string
  endDate?: string
  targetAmount?: number
  status: 'inactive' | 'active' | 'completed' | 'cancelled'
  createdBy?: number
  actualEndDate?: string
  terminationReason?: string
  extensionReason?: string
  createdAt?: string
  updatedAt?: string
}

// v3: group now has head, vice, members
export interface BeneficiaryGroup {
  groupId: number
  name: string
  description?: string
  headEmployeeId?: number
  viceHeadEmployeeId?: number
  members?: number[]          // array of employee_ids
  managerEmployeeId?: number  // legacy
  isActive: boolean
  head?: { employeeId: number; firstName: string; lastName: string }
  viceHead?: { employeeId: number; firstName: string; lastName: string }
  beneficiaries?: Beneficiary[]
}

export interface Beneficiary {
  beneficiaryId: number
  type: 'individual' | 'organization'
  name: string
  contactInfo: Record<string, any>
  locationId?: number
  groupId?: number
  Location?: Location
  BeneficiaryGroup?: BeneficiaryGroup
  createdBy?: number
}

export interface Location {
  locationId: number
  region: string
  city: string
  woreda: string
  description?: string
}

// v3: DonationItem is now per-beneficiary
export interface DonationItem {
  donationItemId: number
  donationId: number
  beneficiaryId: number          // v3 NEW
  distributionDate?: string       // v3 NEW — scheduled, editable by admin
  paymentDate?: string            // v3 NEW — actual date paid
  type: 'money' | 'goods' | 'service'
  description?: string
  quantity: number
  unitValue: number
  totalValue: number
  paymentMethod?: 'bank' | 'cash'
  unassignedDeduction?: number
  isRecurring?: boolean
  status?: 'pending' | 'distributed'
  beneficiary?: Beneficiary
  DonationDistributions?: DonationDistribution[]
  DonationDistributionEvidences?: DonationDistributionEvidence[]
  AdjustmentRequests?: AdjustmentRequest[]
}

export interface DonationDistributionEvidence {
  evidenceId: number
  donationItemId: number
  fileUrl: string
  fileName?: string
  fileType?: string
  uploadedBy?: number
  createdAt?: string
}

export interface DonationDistribution {
  distributionId: number
  donationItemId: number
  beneficiaryId: number
  quantity: number
  value: number
  isReturned?: boolean
  returnReason?: string
  returnedAt?: string
  Beneficiary?: Beneficiary
}

// v3: Donation now has groupId
export interface Donation {
  donationId: number
  companyId: number
  campaignId: number
  groupId?: number               // v3 NEW
  donationDate: string
  totalValue: number
  status: 'draft' | 'pending' | 'approved' | 'distributed' | 'cancelled'
  notes?: string
  Company?: Company
  Campaign?: Campaign
  group?: BeneficiaryGroup
  DonationItems?: DonationItem[]
  DonationApprovals?: DonationApproval[]
  creator?: { employeeId: number; firstName: string; lastName: string }
  approver?: { employeeId: number; firstName: string; lastName: string }
  distributor?: { employeeId: number; firstName: string; lastName: string }
  createdAt?: string
  updatedAt?: string
}

export interface DonationApproval {
  approvalId: number
  donationId: number
  approvedBy?: number
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  createdAt?: string
  Employee?: { employeeId: number; firstName: string; lastName: string }
}

export interface DonationDeduction {
  deductionId: number
  donationItemId: number
  amount: number
  reason: string
  fromBeneficiaryId?: number
  reassignedToBeneficiaryId?: number
  deductionDate?: string
  createdBy?: number
}

export interface DonationLog {
  logId: number
  donationId: number
  userId: number
  action: string
  metadata?: Record<string, any>
  createdAt?: string
}

// v3 NEW
export interface AdjustmentRequest {
  adjustmentId: number
  donationItemId: number
  beneficiaryId: number
  type: 'deduct' | 'increase' | 'reassign' | 'return'
  amount: number
  reason: string
  toBeneficiaryId?: number
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: number
  reviewedBy?: number
  adminComment?: string
  createdAt?: string
  updatedAt?: string
  beneficiary?: { beneficiaryId: number; name: string }
  toBeneficiary?: { beneficiaryId: number; name: string }
  requester?: { employeeId: number; firstName: string; lastName: string }
  reviewer?: { employeeId: number; firstName: string; lastName: string }
  item?: DonationItem
}

export interface Pagination {
  total: number
  page: number
  pages: number
  limit: number
}

// ============================================================================
// SERVICE
// ============================================================================

class CharityService {

  // ── Companies ─────────────────────────────────────────────────────────────
  async getCompanies(params?: { search?: string; type?: string; isActive?: boolean; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)   q.set('search', params.search)
      if (params?.type)     q.set('type', params.type)
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
      if (params?.page)     q.set('page', String(params.page))
      if (params?.limit)    q.set('limit', String(params.limit))
      const res = await api.get(`/charity/companies${q.toString() ? `?${q}` : ''}`)
      return res.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getCompanyById(id: number) {
    try { const r = await api.get(`/charity/companies/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createCompany(data: Partial<Company>) {
    try { const r = await api.post('/charity/companies', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateCompany(id: number, data: Partial<Company>) {
    try { const r = await api.put(`/charity/companies/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteCompany(id: number) {
    try { const r = await api.delete(`/charity/companies/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Campaigns ──────────────────────────────────────────────────────────────
  async getCampaigns(params?: { search?: string; status?: string; category?: string; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)   q.set('search', params.search)
      if (params?.status)   q.set('status', params.status)
      if (params?.category) q.set('category', params.category)
      if (params?.page)     q.set('page', String(params.page))
      if (params?.limit)    q.set('limit', String(params.limit))
      const r = await api.get(`/charity/campaigns${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getCampaignById(id: number) {
    try { const r = await api.get(`/charity/campaigns/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createCampaign(data: Partial<Campaign>) {
    try { const r = await api.post('/charity/campaigns', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateCampaign(id: number, data: Partial<Campaign>) {
    try { const r = await api.put(`/charity/campaigns/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteCampaign(id: number) {
    try { const r = await api.delete(`/charity/campaigns/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async extendCampaign(id: number, newEndDate: string, reason?: string) {
    try { const r = await api.post(`/charity/campaigns/${id}/extend`, { newEndDate, reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async terminateCampaign(id: number, reason?: string) {
    try { const r = await api.post(`/charity/campaigns/${id}/terminate`, { reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateCampaignStatus(id: number, status: string) {
    try { const r = await api.put(`/charity/campaigns/${id}`, { status }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Beneficiary Locations ──────────────────────────────────────────────────
  async getLocations(params?: { region?: string; city?: string; search?: string }) {
    try {
      const q = new URLSearchParams()
      if (params?.region) q.set('region', params.region)
      if (params?.city)   q.set('city', params.city)
      if (params?.search) q.set('search', params.search)
      const r = await api.get(`/charity/locations${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createLocation(data: Partial<Location>) {
    try { const r = await api.post('/charity/locations', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateLocation(id: number, data: Partial<Location>) {
    try { const r = await api.put(`/charity/locations/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteLocation(id: number) {
    try { const r = await api.delete(`/charity/locations/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Beneficiary Groups (v3) ────────────────────────────────────────────────
  async getBeneficiaryGroups() {
    try { const r = await api.get('/charity/beneficiary-groups'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getBeneficiaryGroupById(id: number) {
    try { const r = await api.get(`/charity/beneficiary-groups/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getMyGroup() {
    try { const r = await api.get('/charity/beneficiary-groups/my-group'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getGroupBeneficiaries(groupId: number) {
    try { const r = await api.get(`/charity/beneficiary-groups/${groupId}/beneficiaries`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createBeneficiaryGroup(data: {
    name: string
    description?: string
    headEmployeeId?: number
    viceHeadEmployeeId?: number
    members?: number[]
  }) {
    try { const r = await api.post('/charity/beneficiary-groups', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateBeneficiaryGroup(id: number, data: Partial<BeneficiaryGroup>) {
    try { const r = await api.put(`/charity/beneficiary-groups/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteBeneficiaryGroup(id: number) {
    try { const r = await api.delete(`/charity/beneficiary-groups/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Beneficiaries ──────────────────────────────────────────────────────────
  async getBeneficiaries(params?: { search?: string; type?: string; groupId?: number; locationId?: number; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.search)     q.set('search', params.search)
      if (params?.type)       q.set('type', params.type)
      if (params?.groupId)    q.set('groupId', String(params.groupId))
      if (params?.locationId) q.set('locationId', String(params.locationId))
      if (params?.page)       q.set('page', String(params.page))
      if (params?.limit)      q.set('limit', String(params.limit))
      const r = await api.get(`/charity/beneficiaries${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getBeneficiaryById(id: number) {
    try { const r = await api.get(`/charity/beneficiaries/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async createBeneficiary(data: Partial<Beneficiary>) {
    try { const r = await api.post('/charity/beneficiaries', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateBeneficiary(id: number, data: Partial<Beneficiary>) {
    try { const r = await api.put(`/charity/beneficiaries/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteBeneficiary(id: number) {
    try { const r = await api.delete(`/charity/beneficiaries/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async transferBeneficiary(id: number, toGroupId: number, reason: string) {
    try { const r = await api.post(`/charity/beneficiaries/${id}/transfer`, { toGroupId, reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Donations ──────────────────────────────────────────────────────────────
  async getDonations(params?: { status?: string; companyId?: number; campaignId?: number; groupId?: number; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    try {
      const q = new URLSearchParams()
      if (params?.status)    q.set('status', params.status)
      if (params?.companyId) q.set('companyId', String(params.companyId))
      if (params?.campaignId)q.set('campaignId', String(params.campaignId))
      if (params?.groupId)   q.set('groupId', String(params.groupId))
      if (params?.page)      q.set('page', String(params.page))
      if (params?.limit)     q.set('limit', String(params.limit))
      if (params?.sortBy)    q.set('sortBy', params.sortBy)
      if (params?.sortOrder) q.set('sortOrder', params.sortOrder)
      const r = await api.get(`/charity/donations${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationById(id: number) {
    try { const r = await api.get(`/charity/donations/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  // v3: now includes groupId
  async createDonation(data: { companyId: number; campaignId: number; groupId: number; donationDate: string; notes?: string }) {
    try { const r = await api.post('/charity/donations', data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDonation(id: number, data: Partial<Donation>) {
    try { const r = await api.put(`/charity/donations/${id}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async cancelDonation(id: number) {
    try { const r = await api.delete(`/charity/donations/${id}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // v3: addDonationItem now requires beneficiaryId + distributionDate + paymentMethod
  async addDonationItem(donationId: number, data: {
    beneficiaryId: number
    type: 'money' | 'goods' | 'service'
    description?: string
    quantity: number
    unitValue: number
    paymentMethod?: 'bank' | 'cash'
    distributionDate?: string
    isRecurring?: boolean
    intervalType?: string
    intervalCount?: number
    intervalStartDate?: string
    intervalEndDate?: string
  }) {
    try { const r = await api.post(`/charity/donations/${donationId}/items`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async updateDonationItem(itemId: number, data: Partial<DonationItem>) {
    try { const r = await api.put(`/charity/donations/items/${itemId}`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async deleteDonationItem(itemId: number) {
    try { const r = await api.delete(`/charity/donations/items/${itemId}`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // v3 NEW: edit distribution date (admin only)
  async updateDistributionDate(itemId: number, distributionDate: string) {
    try { const r = await api.put(`/charity/donations/items/${itemId}/distribution-date`, { distributionDate }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Status transitions ─────────────────────────────────────────────────────
  async submitDonation(id: number) {
    try { const r = await api.post(`/charity/donations/${id}/submit`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async approveDonation(id: number, comment?: string) {
    try { const r = await api.post(`/charity/donations/${id}/approve`, { comment }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async requestChanges(donationId: number, comment: string) {
    try { const r = await api.post(`/charity/donations/${donationId}/request-changes`, { comment }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async distributeDonation(id: number) {
    try { const r = await api.post(`/charity/donations/${id}/distribute`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async markItemDistributed(itemId: number) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/distribute-single`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Adjustment Requests (v3 NEW) ───────────────────────────────────────────
  async requestAdjustment(itemId: number, data: {
    type: 'deduct' | 'increase' | 'reassign' | 'return'
    amount: number
    reason: string
    toBeneficiaryId?: number
  }) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/adjustments`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getItemAdjustments(itemId: number) {
    try { const r = await api.get(`/charity/donations/items/${itemId}/adjustments`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getAllPendingAdjustments() {
    try { const r = await api.get('/charity/donations/adjustments/pending'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async reviewAdjustment(adjustmentId: number, status: 'approved' | 'rejected', adminComment?: string) {
    try { const r = await api.put(`/charity/donations/adjustments/${adjustmentId}/review`, { status, adminComment }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Evidence ───────────────────────────────────────────────────────────────
  async uploadItemEvidence(itemId: number, formData: FormData) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/evidences`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async uploadIntervalEvidence(itemId: number, intervalId: number, formData: FormData) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/intervals/${intervalId}/evidences`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Distributions ──────────────────────────────────────────────────────────
  async getDistributions(params?: { donationId?: number; beneficiaryId?: number; page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams()
      if (params?.donationId)    q.set('donationId', String(params.donationId))
      if (params?.beneficiaryId) q.set('beneficiaryId', String(params.beneficiaryId))
      if (params?.page)          q.set('page', String(params.page))
      if (params?.limit)         q.set('limit', String(params.limit))
      const r = await api.get(`/charity/donations/distributions${q.toString() ? `?${q}` : ''}`)
      return r.data
    } catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async returnDistribution(distributionId: number, reason: string) {
    try { const r = await api.post(`/charity/donations/distributions/${distributionId}/return`, { reason }); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Deductions (legacy) ────────────────────────────────────────────────────
  async addDeduction(itemId: number, data: { amount: number; reason: string; fromBeneficiaryId?: number; reassignedToBeneficiaryId?: number }) {
    try { const r = await api.post(`/charity/donations/items/${itemId}/deductions`, data); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getItemDeductions(itemId: number) {
    try { const r = await api.get(`/charity/donations/items/${itemId}/deductions`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Approvals & Logs ───────────────────────────────────────────────────────
  async getApprovalHistory(donationId: number) {
    try { const r = await api.get(`/charity/donations/${donationId}/approvals`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationLogs(donationId: number) {
    try { const r = await api.get(`/charity/donations/${donationId}/logs`); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  async getDonationStats() {
    try { const r = await api.get('/charity/donations/stats/summary'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationsByCampaign() {
    try { const r = await api.get('/charity/donations/stats/by-campaign'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }
  async getDonationsByCompany() {
    try { const r = await api.get('/charity/donations/stats/by-company'); return r.data }
    catch (e: any) { return { success: false, error: e.response?.data?.error || e.message } }
  }

  // ── Employees dropdown ─────────────────────────────────────────────────────
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
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', pending: 'Pending Approval', approved: 'Approved',
      distributed: 'Distributed', cancelled: 'Cancelled',
      inactive: 'Inactive', active: 'Active', completed: 'Completed',
      // adjustment statuses
      deduct: 'Deduction', increase: 'Increase', reassign: 'Reassign', return: 'Return',
      rejected: 'Rejected',
    }
    return labels[status] || status
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default', pending: 'warning', approved: 'info',
      distributed: 'success', cancelled: 'error',
      inactive: 'default', active: 'success', completed: 'info',
      rejected: 'error',
    }
    return colors[status] || 'default'
  }

  getAdjustmentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deduct: 'Deduction', increase: 'Increase',
      reassign: 'Reassignment', return: 'Return',
    }
    return labels[type] || type
  }

  getAdjustmentTypeColor(type: string): string {
    const colors: Record<string, string> = {
      deduct: '#ef4444', increase: '#22c55e',
      reassign: '#f59e0b', return: '#6366f1',
    }
    return colors[type] || '#6b7280'
  }

  getDonationTypeLabel(type: string): string {
    const labels: Record<string, string> = { money: 'Money', goods: 'Goods', service: 'Service' }
    return labels[type] || type
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ET', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0) + ' ETB'
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
}

export default new CharityService()