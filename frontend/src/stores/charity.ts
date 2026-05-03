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
  status?: 'pending' | 'distributed'
  DonationDistributions?: DonationDistribution[]
  DonationDistributionEvidences?: DonationDistributionEvidence[]
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
  // COMPANIES
  // --------------------------------------------------------------------------

  async getCompanies(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    type?: string
    isActive?: boolean | string
    search?: string
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/companies${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data as Company[],
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch companies',
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  async getCompanyById(id: number) {
    try {
      const response = await api.get(`/charity/companies/${id}`)
      return { success: true, data: response.data.data as Company }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch company' }
    }
  }

  async createCompany(data: Partial<Company>) {
    try {
      const response = await api.post('/charity/companies', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create company' }
    }
  }

  async updateCompany(id: number, data: Partial<Company>) {
    try {
      const response = await api.put(`/charity/companies/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update company' }
    }
  }

  async deleteCompany(id: number) {
    try {
      const response = await api.delete(`/charity/companies/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete company' }
    }
  }

  // --------------------------------------------------------------------------
  // CAMPAIGNS
  // --------------------------------------------------------------------------

  async getCampaigns(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    status?: string
    category?: string
    search?: string
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/campaigns${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data as Campaign[],
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch campaigns',
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  async getCampaignById(id: number) {
    try {
      const response = await api.get(`/charity/campaigns/${id}`)
      return { success: true, data: response.data.data as Campaign }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch campaign' }
    }
  }

  async getCampaignProgress(id: number) {
    try {
      const response = await api.get(`/charity/campaigns/${id}/progress`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch progress' }
    }
  }

  async createCampaign(data: Partial<Campaign>) {
    try {
      const response = await api.post('/charity/campaigns', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create campaign' }
    }
  }

  async updateCampaign(id: number, data: Partial<Campaign>) {
    try {
      const response = await api.put(`/charity/campaigns/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update campaign' }
    }
  }

  async deleteCampaign(id: number) {
    try {
      const response = await api.delete(`/charity/campaigns/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete campaign' }
    }
  }

  async extendCampaign(id: number, newEndDate: string, reason?: string) {
    try {
      const response = await api.post(`/charity/campaigns/${id}/extend`, { newEndDate, reason })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to extend campaign' }
    }
  }

  async terminateCampaign(id: number, reason?: string) {
    try {
      const response = await api.post(`/charity/campaigns/${id}/terminate`, { reason })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to terminate campaign' }
    }
  }

  // --------------------------------------------------------------------------
  // LOCATIONS
  // --------------------------------------------------------------------------

  async getLocations(params?: { region?: string; city?: string; search?: string }) {
    try {
      const query = new URLSearchParams()
      if (params?.region) query.append('region', params.region)
      if (params?.city) query.append('city', params.city)
      if (params?.search) query.append('search', params.search)
      const url = `/charity/locations${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return { success: true, data: response.data.data as Location[] }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch locations', data: [] }
    }
  }

  async createLocation(data: Partial<Location>) {
    try {
      const response = await api.post('/charity/locations', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create location' }
    }
  }

  async updateLocation(id: number, data: Partial<Location>) {
    try {
      const response = await api.put(`/charity/locations/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update location' }
    }
  }

  async deleteLocation(id: number) {
    try {
      const response = await api.delete(`/charity/locations/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
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
      return { success: false, error: error.response?.data?.error || 'Failed to fetch groups', data: [] }
    }
  }

  async createBeneficiaryGroup(data: Partial<BeneficiaryGroup>) {
    try {
      const response = await api.post('/charity/beneficiary-groups', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create group' }
    }
  }

  async updateBeneficiaryGroup(id: number, data: Partial<BeneficiaryGroup>) {
    try {
      const response = await api.put(`/charity/beneficiary-groups/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update group' }
    }
  }

  async deleteBeneficiaryGroup(id: number) {
    try {
      const response = await api.delete(`/charity/beneficiary-groups/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete group' }
    }
  }

  async assignManagerToGroup(groupId: number, managerEmployeeId: number) {
    try {
      const response = await api.post(`/charity/beneficiary-groups/${groupId}/assign-manager`, { managerEmployeeId })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to assign manager' }
    }
  }

  // --------------------------------------------------------------------------
  // BENEFICIARIES
  // --------------------------------------------------------------------------

  async getBeneficiaries(params?: {
    page?: number
    size?: number
    sortBy?: string
    sortOrder?: string
    type?: string
    groupId?: number | string
    locationId?: number | string
    search?: string
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/beneficiaries${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data as Beneficiary[],
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch beneficiaries',
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  async getBeneficiaryById(id: number) {
    try {
      const response = await api.get(`/charity/beneficiaries/${id}`)
      return { success: true, data: response.data.data as Beneficiary }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch beneficiary' }
    }
  }

  async createBeneficiary(data: Partial<Beneficiary>) {
    try {
      const response = await api.post('/charity/beneficiaries', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create beneficiary' }
    }
  }

  async updateBeneficiary(id: number, data: Partial<Beneficiary>) {
    try {
      const response = await api.put(`/charity/beneficiaries/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update beneficiary' }
    }
  }

  async deleteBeneficiary(id: number) {
    try {
      const response = await api.delete(`/charity/beneficiaries/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete beneficiary' }
    }
  }

  async transferBeneficiary(id: number, toGroupId: number, reason: string) {
    try {
      const response = await api.post(`/charity/beneficiaries/${id}/transfer`, { toGroupId, reason })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to transfer beneficiary' }
    }
  }

  async getBeneficiaryTransfers(id: number) {
    try {
      const response = await api.get(`/charity/beneficiaries/${id}/transfers`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch transfers', data: [] }
    }
  }

  // --------------------------------------------------------------------------
  // DONATIONS (CORE)
  // --------------------------------------------------------------------------

  async getDonations(params?: {
    page?: number
    size?: number
    status?: string
    companyId?: number | string
    campaignId?: number | string
    startDate?: string
    endDate?: string
    search?: string
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/donations${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data as Donation[],
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch donations',
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
      return { success: false, error: error.response?.data?.error || 'Failed to fetch donation' }
    }
  }

  async createDonation(data: {
    companyId: number
    campaignId: number
    donationDate: string
    notes?: string
  }) {
    try {
      const response = await api.post('/charity/donations', data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create donation' }
    }
  }

  async updateDonation(id: number, data: Partial<Donation>) {
    try {
      const response = await api.put(`/charity/donations/${id}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update donation' }
    }
  }

  async cancelDonation(id: number) {
    try {
      const response = await api.delete(`/charity/donations/${id}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to cancel donation' }
    }
  }

  // Donation Items
 async addDonationItem(donationId: number, data: {
  type: string
  description?: string
  quantity: number
  unitValue: number
  paymentMethod?: string
  interval?: any
}) {
  try {
    const response = await api.post(`/charity/donations/${donationId}/items`, data)
    return { success: true, message: response.data.message, data: response.data.data }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to add item' }
  }
}
  async updateDonationItem(itemId: number, data: {
    quantity?: number
    unitValue?: number
    description?: string
  }) {
    try {
      const response = await api.put(`/charity/donations/items/${itemId}`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update item' }
    }
  }

  async deleteDonationItem(itemId: number) {
    try {
      const response = await api.delete(`/charity/donations/items/${itemId}`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete item' }
    }
  }

  // Status Transitions
  async submitDonation(id: number) {
    try {
      const response = await api.post(`/charity/donations/${id}/submit`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to submit donation' }
    }
  }

  async requestChanges(donationId: number, comment: string) {
    try {
      const response = await api.post(`/charity/donations/${donationId}/request-changes`, { comment })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to request changes' }
    }
  }

  async approveDonation(id: number, comment?: string) {
    try {
      const response = await api.post(`/charity/donations/${id}/approve`, { comment })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to approve donation' }
    }
  }

  async distributeDonation(id: number) {
    try {
      const response = await api.post(`/charity/donations/${id}/distribute`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to distribute donation' }
    }
  }

  async markItemDistributed(itemId: number) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/distribute-single`)
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to mark item distributed' }
    }
  }

  // Distributions
  async distributeItem(itemId: number, distributions: {
    beneficiaryId: number
    quantity: number
    value?: number
  }[]) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/distribute`, { distributions })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to distribute item' }
    }
  }
  
async deleteItemDistributions(itemId: number) {
  try {
    const response = await api.delete(`/charity/donations/items/${itemId}/distributions`)
    return { success: true, message: response.data.message }
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to clear item distributions' }
  }
}


  async getDistributions(params?: {
    page?: number
    size?: number
    beneficiaryId?: number
    donationId?: number
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/donations/distributions${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch distributions',
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  async getDistributionById(distributionId: number) {
    try {
      const response = await api.get(`/charity/donations/distributions/${distributionId}`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch distribution' }
    }
  }

  async returnDistribution(distributionId: number, reason: string) {
    try {
      const response = await api.post(`/charity/donations/distributions/${distributionId}/return`, { reason })
      return { success: true, message: response.data.message }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to return distribution' }
    }
  }

  // Evidence uploads
  async uploadItemEvidence(itemId: number, formData: FormData) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/evidences`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to upload evidence' }
    }
  }

  // Deductions (money items)
  async addDeduction(itemId: number, data: {
    amount: number
    reason: string
    reassignedToBeneficiaryId?: number
  }) {
    try {
      const response = await api.post(`/charity/donations/items/${itemId}/deductions`, data)
      return { success: true, message: response.data.message, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to add deduction' }
    }
  }

  async getItemDeductions(itemId: number) {
    try {
      const response = await api.get(`/charity/donations/items/${itemId}/deductions`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch deductions', data: [] }
    }
  }

  // Approvals & Logs
  async getApprovalHistory(donationId: number) {
    try {
      const response = await api.get(`/charity/donations/${donationId}/approvals`)
      return { success: true, data: response.data.data as DonationApproval[] }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch approval history', data: [] }
    }
  }

  async getDonationLogs(donationId: number, params?: {
    page?: number
    size?: number
  }) {
    try {
      const query = new URLSearchParams()
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all')
          query.append(key, String(value))
      })
      const url = `/charity/donations/${donationId}/logs${query.toString() ? `?${query}` : ''}`
      const response = await api.get(url)
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination as Pagination
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch logs',
        data: [],
        pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 }
      }
    }
  }

  // Statistics
  async getDonationStats() {
    try {
      const response = await api.get('/charity/donations/stats/summary')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch stats' }
    }
  }

  async getDonationsByCampaign() {
    try {
      const response = await api.get('/charity/donations/stats/by-campaign')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch donations by campaign', data: [] }
    }
  }

  async getDonationsByCompany() {
    try {
      const response = await api.get('/charity/donations/stats/by-company')
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to fetch donations by company', data: [] }
    }
  }

async distributeItemForInterval(itemId: number, intervalId: number, data: { distributions: any[] }) {
  try {
    const response = await api.post(`/charity/donations/items/${itemId}/distribute/${intervalId}`, data);
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to distribute for interval' };
  }
}

async uploadIntervalEvidence(itemId: number, intervalId: number, formData: FormData) {
  try {
    const response = await api.post(`/charity/donations/items/${itemId}/intervals/${intervalId}/evidences`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, message: response.data.message, data: response.data.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to upload evidence for interval' };
  }
}

    async updateDonationItemInterval(itemId: number, interval: any) {
  try {
    const response = await api.put(`/charity/donations/items/${itemId}/interval`, { interval });
    return { success: true, message: response.data.message };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to update interval' };
  }
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