// stores/charity.ts
import api from './interceptor'

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
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  createdBy?: number
  actualEndDate?: string
  terminationReason?: string
  extensionReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface DonationItem {
  donationItemId: number
  donationId: number
  type: 'money' | 'goods' | 'service'
  description?: string
  quantity: number
  unitValue: number
  totalValue: number
  paymentMethod?: 'bank' | 'cash'
  unassignedDeduction?: number
  DonationDistributions?: DonationDistribution[]
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

export interface Donation {
  donationId: number
  companyId: number
  campaignId: number
  donationDate: string
  totalValue: number
  status: 'draft' | 'pending' | 'approved' | 'distributed' | 'cancelled'
  notes?: string
  Company?: Company
  Campaign?: Campaign
  DonationItems?: DonationItem[]
  DonationApprovals?: DonationApproval[]
}

export interface DonationApproval {
  approvalId: number
  donationId: number
  approvedBy?: number
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  Employee?: {
    employeeId: number
    firstName: string
    lastName: string
  }
}

export interface BeneficiaryGroup {
  groupId: number
  name: string
  description?: string
  managerEmployeeId?: number
  isActive: boolean
  manager?: {
    employeeId: number
    firstName: string
    lastName: string
  }
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
  createdAt?: string
  updatedAt?: string
}

export interface Location {
  locationId: number
  region?: string
  city?: string
  woreda?: string
  description?: string
}

export interface DonationDeduction {
  deductionId: number
  donationItemId: number
  amount: number
  reason: string
  reassignedToBeneficiaryId?: number
  deductionDate: string
  createdBy?: number
}

export interface DonationLog {
  logId: number
  donationId: number
  userId: number
  action: string
  metadata: Record<string, any>
  createdAt: string
  Employee?: {
    employeeId: number
    firstName: string
    lastName: string
  }
}

export interface Pagination {
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

// ============================================================================
// CHARITY SERVICE
// ============================================================================

class CharityService {
  // --------------------------------------------------------------------------
  // PAGINATION HELPER
  // --------------------------------------------------------------------------
  private buildPaginationParams(params: Record<string, any>): string {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query.append(key, String(value))
      }
    })
    return query.toString()
  }

  // --------------------------------------------------------------------------
  // COMPANIES
  // --------------------------------------------------------------------------

  /**
   * List companies with optional pagination, filters, sorting
   */
  async getCompanies(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    type?: string
    isActive?: boolean | string
    search?: string
  }): Promise<{ success: boolean; data: Company[]; pagination: Pagination }> {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      type: params?.type,
      isActive: params?.isActive,
      search: params?.search
    })
    const url = `/charity/companies${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data as Company[],
      pagination: response.data.pagination as Pagination
    }
  }

  async getCompanyById(id: number) {
    const response = await api.get(`/charity/companies/${id}`)
    return { success: true, data: response.data.data as Company }
  }

  async createCompany(data: Partial<Company>) {
    const response = await api.post('/charity/companies', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateCompany(id: number, data: Partial<Company>) {
    const response = await api.put(`/charity/companies/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteCompany(id: number) {
    const response = await api.delete(`/charity/companies/${id}`)
    return { success: true, message: response.data.message }
  }

  // --------------------------------------------------------------------------
  // CAMPAIGNS
  // --------------------------------------------------------------------------

  /**
   * List campaigns with pagination, filters, sorting
   */
  async getCampaigns(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    status?: string
    category?: string
    search?: string
  }): Promise<{ success: boolean; data: Campaign[]; pagination: Pagination }> {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      status: params?.status,
      category: params?.category,
      search: params?.search
    })
    const url = `/charity/campaigns${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data as Campaign[],
      pagination: response.data.pagination as Pagination
    }
  }

  async getCampaignById(id: number) {
    const response = await api.get(`/charity/campaigns/${id}`)
    return { success: true, data: response.data.data as Campaign }
  }

  async getCampaignProgress(id: number) {
    const response = await api.get(`/charity/campaigns/${id}/progress`)
    return { success: true, data: response.data.data }
  }

  async createCampaign(data: Partial<Campaign>) {
    const response = await api.post('/charity/campaigns', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateCampaign(id: number, data: Partial<Campaign>) {
    const response = await api.put(`/charity/campaigns/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteCampaign(id: number) {
    const response = await api.delete(`/charity/campaigns/${id}`)
    return { success: true, message: response.data.message }
  }

  async extendCampaign(id: number, newEndDate: string, reason?: string) {
    const response = await api.post(`/charity/campaigns/${id}/extend`, { newEndDate, reason })
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async terminateCampaign(id: number, reason?: string) {
    const response = await api.post(`/charity/campaigns/${id}/terminate`, { reason })
    return { success: true, message: response.data.message, data: response.data.data }
  }

  // --------------------------------------------------------------------------
  // LOCATIONS
  // --------------------------------------------------------------------------

  async getLocations(params?: { region?: string; city?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.region) query.append('region', params.region)
    if (params?.city) query.append('city', params.city)
    if (params?.search) query.append('search', params.search)
    const url = `/charity/locations${query.toString() ? `?${query}` : ''}`
    const response = await api.get(url)
    return { success: true, data: response.data.data as Location[] }
  }

  async createLocation(data: Partial<Location>) {
    const response = await api.post('/charity/locations', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateLocation(id: number, data: Partial<Location>) {
    const response = await api.put(`/charity/locations/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteLocation(id: number) {
    const response = await api.delete(`/charity/locations/${id}`)
    return { success: true, message: response.data.message }
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY GROUPS
  // --------------------------------------------------------------------------

  async getBeneficiaryGroups() {
    const response = await api.get('/charity/beneficiary-groups')
    return { success: true, data: response.data.data as BeneficiaryGroup[] }
  }

  async createBeneficiaryGroup(data: Partial<BeneficiaryGroup>) {
    const response = await api.post('/charity/beneficiary-groups', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateBeneficiaryGroup(id: number, data: Partial<BeneficiaryGroup>) {
    const response = await api.put(`/charity/beneficiary-groups/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteBeneficiaryGroup(id: number) {
    const response = await api.delete(`/charity/beneficiary-groups/${id}`)
    return { success: true, message: response.data.message }
  }

  async assignManagerToGroup(groupId: number, managerEmployeeId: number) {
    const response = await api.post(`/charity/beneficiary-groups/${groupId}/assign-manager`, { managerEmployeeId })
    return { success: true, message: response.data.message, data: response.data.data }
  }

  // --------------------------------------------------------------------------
  // BENEFICIARIES
  // --------------------------------------------------------------------------

  /**
   * List beneficiaries with pagination, filters, sorting
   */
  async getBeneficiaries(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    type?: string
    groupId?: number | string
    locationId?: number | string
    search?: string
  }): Promise<{ success: boolean; data: Beneficiary[]; pagination: Pagination }> {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      type: params?.type,
      groupId: params?.groupId,
      locationId: params?.locationId,
      search: params?.search
    })
    const url = `/charity/beneficiaries${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data as Beneficiary[],
      pagination: response.data.pagination as Pagination
    }
  }

  async getBeneficiaryById(id: number) {
    const response = await api.get(`/charity/beneficiaries/${id}`)
    return { success: true, data: response.data.data as Beneficiary }
  }

  async createBeneficiary(data: Partial<Beneficiary>) {
    const response = await api.post('/charity/beneficiaries', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateBeneficiary(id: number, data: Partial<Beneficiary>) {
    const response = await api.put(`/charity/beneficiaries/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteBeneficiary(id: number) {
    const response = await api.delete(`/charity/beneficiaries/${id}`)
    return { success: true, message: response.data.message }
  }

  async transferBeneficiary(id: number, toGroupId: number, reason: string) {
    const response = await api.post(`/charity/beneficiaries/${id}/transfer`, { toGroupId, reason })
    return { success: true, message: response.data.message }
  }

  async getBeneficiaryTransfers(id: number) {
    const response = await api.get(`/charity/beneficiaries/${id}/transfers`)
    return { success: true, data: response.data.data }
  }

  // --------------------------------------------------------------------------
  // DONATIONS (CORE)
  // --------------------------------------------------------------------------

  /**
   * List donations with pagination, filters
   */
  async getDonations(params?: {
    page?: number
    size?: number
    status?: string
    companyId?: number | string
    campaignId?: number | string
    startDate?: string
    endDate?: string
    search?: string
  }): Promise<{ success: boolean; data: Donation[]; pagination: Pagination }> {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size,
      status: params?.status,
      companyId: params?.companyId,
      campaignId: params?.campaignId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      search: params?.search
    })
    const url = `/charity/donations${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data as Donation[],
      pagination: response.data.pagination as Pagination
    }
  }

  async getDonationById(id: number) {
    const response = await api.get(`/charity/donations/${id}`)
    return { success: true, data: response.data.data as Donation }
  }

  async createDonation(data: {
    companyId: number
    campaignId: number
    donationDate: string
    notes?: string
  }) {
    const response = await api.post('/charity/donations', data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateDonation(id: number, data: Partial<Donation>) {
    const response = await api.put(`/charity/donations/${id}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async cancelDonation(id: number) {
    const response = await api.delete(`/charity/donations/${id}`)
    return { success: true, message: response.data.message }
  }

  // Donation Items
  async addDonationItem(donationId: number, data: {
    type: string
    description?: string
    quantity: number
    unitValue: number
    paymentMethod?: string
  }) {
    const response = await api.post(`/charity/donations/${donationId}/items`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async updateDonationItem(itemId: number, data: {
    quantity?: number
    unitValue?: number
    description?: string
  }) {
    const response = await api.put(`/charity/donations/items/${itemId}`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async deleteDonationItem(itemId: number) {
    const response = await api.delete(`/charity/donations/items/${itemId}`)
    return { success: true, message: response.data.message }
  }

  // Status Transitions
  async submitDonation(id: number) {
    const response = await api.post(`/charity/donations/${id}/submit`)
    return { success: true, message: response.data.message }
  }

  async approveDonation(id: number, comment?: string) {
    const response = await api.post(`/charity/donations/${id}/approve`, { comment })
    return { success: true, message: response.data.message }
  }

  async distributeDonation(id: number) {
    const response = await api.post(`/charity/donations/${id}/distribute`)
    return { success: true, message: response.data.message }
  }

  // Distributions
  async distributeItem(itemId: number, distributions: {
    beneficiaryId: number
    quantity: number
    value?: number
  }[]) {
    const response = await api.post(`/charity/donations/items/${itemId}/distribute`, { distributions })
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async getDistributions(params?: {
    page?: number
    size?: number
    beneficiaryId?: number
    donationId?: number
  }) {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size,
      beneficiaryId: params?.beneficiaryId,
      donationId: params?.donationId
    })
    const url = `/charity/donations/distributions${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination as Pagination
    }
  }

  async getDistributionById(distributionId: number) {
    const response = await api.get(`/charity/donations/distributions/${distributionId}`)
    return { success: true, data: response.data.data }
  }

  async returnDistribution(distributionId: number, reason: string) {
    const response = await api.post(`/charity/donations/distributions/${distributionId}/return`, { reason })
    return { success: true, message: response.data.message }
  }

  // Deductions (money items)
  async addDeduction(itemId: number, data: {
    amount: number
    reason: string
    reassignedToBeneficiaryId?: number
  }) {
    const response = await api.post(`/charity/donations/items/${itemId}/deductions`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  }

  async getItemDeductions(itemId: number) {
    const response = await api.get(`/charity/donations/items/${itemId}/deductions`)
    return { success: true, data: response.data.data }
  }

  // Approvals & Logs
  async getApprovalHistory(donationId: number) {
    const response = await api.get(`/charity/donations/${donationId}/approvals`)
    return { success: true, data: response.data.data as DonationApproval[] }
  }

  async getDonationLogs(donationId: number, params?: {
    page?: number
    size?: number
  }) {
    const query = this.buildPaginationParams({
      page: params?.page,
      size: params?.size
    })
    const url = `/charity/donations/${donationId}/logs${query ? `?${query}` : ''}`
    const response = await api.get(url)
    return {
      success: true,
      data: response.data.data,
      pagination: response.data.pagination as Pagination
    }
  }

  // Statistics
  async getDonationStats() {
    const response = await api.get('/charity/donations/stats/summary')
    return { success: true, data: response.data.data }
  }

  async getDonationsByCampaign() {
    const response = await api.get('/charity/donations/stats/by-campaign')
    return { success: true, data: response.data.data }
  }

  async getDonationsByCompany() {
    const response = await api.get('/charity/donations/stats/by-company')
    return { success: true, data: response.data.data }
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending Approval',
      approved: 'Approved',
      distributed: 'Distributed',
      cancelled: 'Cancelled'
    }
    return labels[status] || status
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      pending: 'warning',
      approved: 'info',
      distributed: 'success',
      cancelled: 'error'
    }
    return colors[status] || 'default'
  }

  getDonationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      money: 'Money',
      goods: 'Goods',
      service: 'Service'
    }
    return labels[type] || type
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount || 0)
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

export default new CharityService()