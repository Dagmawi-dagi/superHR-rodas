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
  createdAt?: string
  updatedAt?: string
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
  createdAt?: string
  updatedAt?: string
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
  createdAt?: string
  updatedAt?: string
}

export interface Beneficiary {
  beneficiaryId: number
  type: 'individual' | 'group' | 'organization'
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
  createdAt?: string
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

// ============================================================================
// PAGINATION & FILTER PARAMS
// ============================================================================

export interface GetDonationsParams {
  page?: number
  size?: number
  status?: string
  companyId?: number | string
  campaignId?: number | string
  startDate?: string
  endDate?: string
  search?: string
}

export interface PaginatedDonationsResponse {
  success: boolean
  data: Donation[]
  pagination: {
    totalItems: number
    totalPages: number
    currentPage: number
    pageSize: number
  }
}

export interface DonationStatsSummary {
  totalDonations: number
  totalValue: number
  statusBreakdown: Record<string, number>
  valueByType: Record<string, number>
  recentDonations: Donation[]
}

// ============================================================================
// CHARITY SERVICE
// ============================================================================

class CharityService {
  // --------------------------------------------------------------------------
  // COMPANIES
  // --------------------------------------------------------------------------
  async getCompanies(params?: { type?: string; isActive?: boolean; search?: string }) {
    try {
      const response = await api.get('/charity/companies')
      return { success: true, data: response.data.data as Company[] }
    } catch (error: any) {
      console.error('Get companies error:', error)
      return { success: false, data: [], error: error.response?.data?.error || 'Failed to fetch companies' }
    }
  }

  async getCompanyById(id: number) {
    try {
      const response = await api.get(`/charity/companies/${id}`)
      return { success: true, data: response.data.data as Company }
    } catch (error: any) {
      console.error('Get company error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch company' }
    }
  }

  async createCompany(data: Partial<Company>) {
    try {
      const response = await api.post('/charity/companies', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create company error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create company' }
    }
  }

  async updateCompany(id: number, data: Partial<Company>) {
    try {
      const response = await api.put(`/charity/companies/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update company error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update company' }
    }
  }

  async deleteCompany(id: number) {
    try {
      const response = await api.delete(`/charity/companies/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete company error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete company' }
    }
  }

  // --------------------------------------------------------------------------
  // CAMPAIGNS
  // --------------------------------------------------------------------------
  async getCampaigns(params?: { status?: string; category?: string; search?: string }) {
    try {
      const response = await api.get('/charity/campaigns', { params })
      return { success: true, data: response.data.data as Campaign[] }
    } catch (error: any) {
      console.error('Get campaigns error:', error)
      return { success: false, data: [], error: error.response?.data?.error || 'Failed to fetch campaigns' }
    }
  }

  async getCampaignById(id: number) {
    try {
      const response = await api.get(`/charity/campaigns/${id}`)
      return { success: true, data: response.data.data as Campaign }
    } catch (error: any) {
      console.error('Get campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch campaign' }
    }
  }

  async getCampaignProgress(id: number) {
    try {
      const response = await api.get(`/charity/campaigns/${id}/progress`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Get campaign progress error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch progress' }
    }
  }

  async createCampaign(data: Partial<Campaign>) {
    try {
      const response = await api.post('/charity/campaigns', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create campaign' }
    }
  }

  async updateCampaign(id: number, data: Partial<Campaign>) {
    try {
      const response = await api.put(`/charity/campaigns/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update campaign' }
    }
  }

  async deleteCampaign(id: number) {
    try {
      const response = await api.delete(`/charity/campaigns/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete campaign' }
    }
  }

  async extendCampaign(id: number, newEndDate: string, reason?: string) {
    try {
      const response = await api.post(`/charity/campaigns/${id}/extend`, { newEndDate, reason })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Extend campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to extend campaign' }
    }
  }

  async terminateCampaign(id: number, reason?: string) {
    try {
      const response = await api.post(`/charity/campaigns/${id}/terminate`, { reason })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Terminate campaign error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to terminate campaign' }
    }
  }

  // --------------------------------------------------------------------------
  // LOCATIONS
  // --------------------------------------------------------------------------
  async getLocations(params?: { region?: string; city?: string; search?: string }) {
    try {
      const response = await api.get('/charity/locations', { params })
      return { success: true, data: response.data.data as Location[] }
    } catch (error: any) {
      console.error('Get locations error:', error)
      return { success: false, data: [], error: error.response?.data?.error || 'Failed to fetch locations' }
    }
  }

  async createLocation(data: Partial<Location>) {
    try {
      const response = await api.post('/charity/locations', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create location error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create location' }
    }
  }

  async updateLocation(id: number, data: Partial<Location>) {
    try {
      const response = await api.put(`/charity/locations/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update location error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update location' }
    }
  }

  async deleteLocation(id: number) {
    try {
      const response = await api.delete(`/charity/locations/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete location error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete location' }
    }
  }

  // --------------------------------------------------------------------------
  // BENEFICIARY GROUPS
  // --------------------------------------------------------------------------
  async getBeneficiaryGroups() {
    try {
      const response = await api.get('/charity/beneficiary-groups')
      return { success: true, data: response.data.data as BeneficiaryGroup[] }
    } catch (error: any) {
      console.error('Get groups error:', error)
      return { success: false, data: [], error: error.response?.data?.error || 'Failed to fetch groups' }
    }
  }

  async createBeneficiaryGroup(data: Partial<BeneficiaryGroup>) {
    try {
      const response = await api.post('/charity/beneficiary-groups', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create group error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create group' }
    }
  }

  async updateBeneficiaryGroup(id: number, data: Partial<BeneficiaryGroup>) {
    try {
      const response = await api.put(`/charity/beneficiary-groups/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update group error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update group' }
    }
  }

  async deleteBeneficiaryGroup(id: number) {
    try {
      const response = await api.delete(`/charity/beneficiary-groups/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete group error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete group' }
    }
  }

  // --------------------------------------------------------------------------
  // BENEFICIARIES
  // --------------------------------------------------------------------------
  async getBeneficiaries(params?: { type?: string; groupId?: number; locationId?: number; search?: string }) {
    try {
      const response = await api.get('/charity/beneficiaries', { params })
      return { success: true, data: response.data.data as Beneficiary[] }
    } catch (error: any) {
      console.error('Get beneficiaries error:', error)
      return { success: false, data: [], error: error.response?.data?.error || 'Failed to fetch beneficiaries' }
    }
  }

  async getBeneficiaryById(id: number) {
    try {
      const response = await api.get(`/charity/beneficiaries/${id}`)
      return { success: true, data: response.data.data as Beneficiary }
    } catch (error: any) {
      console.error('Get beneficiary error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch beneficiary' }
    }
  }

  async createBeneficiary(data: Partial<Beneficiary>) {
    try {
      const response = await api.post('/charity/beneficiaries', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create beneficiary error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create beneficiary' }
    }
  }

  async updateBeneficiary(id: number, data: Partial<Beneficiary>) {
    try {
      const response = await api.put(`/charity/beneficiaries/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update beneficiary error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update beneficiary' }
    }
  }

  async deleteBeneficiary(id: number) {
    try {
      const response = await api.delete(`/charity/beneficiaries/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete beneficiary error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete beneficiary' }
    }
  }

  async transferBeneficiary(id: number, toGroupId: number, reason: string) {
    try {
      const response = await api.post(`/charity/beneficiaries/${id}/transfer`, { toGroupId, reason })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Transfer beneficiary error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to transfer beneficiary' }
    }
  }

  // --------------------------------------------------------------------------
  // DONATIONS (CORE)
  // --------------------------------------------------------------------------
  async getDonations(params: GetDonationsParams = {}): Promise<PaginatedDonationsResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.size) queryParams.append('size', params.size.toString())
      if (params.status) queryParams.append('status', params.status)
      if (params.companyId && params.companyId !== 'all') queryParams.append('companyId', params.companyId.toString())
      if (params.campaignId && params.campaignId !== 'all') queryParams.append('campaignId', params.campaignId.toString())
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.search) queryParams.append('search', params.search)

      const url = `/charity/donations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await api.get(url)

      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          totalItems: 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10
        }
      }
    } catch (error: any) {
      console.error('Get donations error:', error)
      return {
        success: false,
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  async getDonationById(id: number) {
    try {
      const response = await api.get(`/charity/donations/${id}`)
      return { success: true, data: response.data.data as Donation }
    } catch (error: any) {
      console.error('Get donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch donation' }
    }
  }

  async createDonation(data: { companyId: number; campaignId: number; donationDate: string; notes?: string }) {
    try {
      const response = await api.post('/charity/donations', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Create donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to create donation' }
    }
  }

  async updateDonation(id: number, data: Partial<Donation>) {
    try {
      const response = await api.put(`/charity/donations/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update donation' }
    }
  }

  async cancelDonation(id: number) {
    try {
      const response = await api.delete(`/charity/donations/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Cancel donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to cancel donation' }
    }
  }

  // Donation Items
  async addDonationItem(donationId: number, data: { type: string; description?: string; quantity: number; unitValue: number }) {
    try {
      const response = await api.post(`/charity/donations/${donationId}/items`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Add item error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to add item' }
    }
  }

  async updateDonationItem(itemId: number, data: { quantity?: number; unitValue?: number; description?: string }) {
    try {
      const response = await api.put(`/charity/donations/items/${itemId}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Update item error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to update item' }
    }
  }

  async deleteDonationItem(itemId: number) {
    try {
      const response = await api.delete(`/charity/donations/items/${itemId}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Delete item error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to delete item' }
    }
  }

  // Status Transitions
  async submitDonation(id: number) {
    try {
      const response = await api.post(`/charity/donations/${id}/submit`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Submit donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to submit donation' }
    }
  }

  async approveDonation(id: number, comment?: string) {
    try {
      const response = await api.post(`/charity/donations/${id}/approve`, { comment })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Approve donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to approve donation' }
    }
  }

  async distributeDonation(id: number) {
    try {
      const response = await api.post(`/charity/donations/${id}/distribute`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Distribute donation error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to distribute donation' }
    }
  }

  // Distributions
  async distributeItem(itemId: number, distributions: { beneficiaryId: number; quantity: number }[]) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/distribute`, { distributions })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Distribute item error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to distribute item' }
    }
  }

  async getDistributions(params?: { page?: number; size?: number; beneficiaryId?: number; donationId?: number }) {
    try {
      const response = await api.get('/charity/donations/distributions', { params })
      return { success: true, data: response.data.data, pagination: response.data.pagination }
    } catch (error: any) {
      console.error('Get distributions error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  async returnDistribution(distributionId: number, reason: string) {
    try {
      const response = await api.post(`/charity/donations/distributions/${distributionId}/return`, { reason })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      console.error('Return distribution error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to return distribution' }
    }
  }

  // Deductions
  async addDeduction(itemId: number, data: { amount: number; reason: string; reassignedToBeneficiaryId?: number }) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/deductions`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      console.error('Add deduction error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to add deduction' }
    }
  }

  async getItemDeductions(itemId: number) {
    try {
      const response = await api.get(`/charity/donations/items/${itemId}/deductions`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Get deductions error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  // Approvals & Logs
  async getApprovalHistory(donationId: number) {
    try {
      const response = await api.get(`/charity/donations/${donationId}/approvals`)
      return { success: true, data: response.data.data as DonationApproval[] }
    } catch (error: any) {
      console.error('Get approval history error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  async getDonationLogs(donationId: number, params?: { page?: number; size?: number }) {
    try {
      const response = await api.get(`/charity/donations/${donationId}/logs`, { params })
      return { success: true, data: response.data.data, pagination: response.data.pagination }
    } catch (error: any) {
      console.error('Get logs error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  // Stats
  async getDonationStats(): Promise<{ success: boolean; data?: DonationStatsSummary; error?: string }> {
    try {
      const response = await api.get('/charity/donations/stats/summary')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Get donation stats error:', error)
      return { success: false, error: error.response?.data?.error || 'Failed to fetch stats' }
    }
  }

  async getDonationsByCampaign() {
    try {
      const response = await api.get('/charity/donations/stats/by-campaign')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Get donations by campaign error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  async getDonationsByCompany() {
    try {
      const response = await api.get('/charity/donations/stats/by-company')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      console.error('Get donations by company error:', error)
      return { success: false, data: [], error: error.response?.data?.error }
    }
  }

  // ============================================================================
  // UTILITY METHODS (matching employee service pattern)
  // ============================================================================
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount)
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