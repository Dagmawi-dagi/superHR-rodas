<template>
  <div class="campaigns-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Campaign Management</h1>
        <p class="page-subtitle">Manage fundraising campaigns</p>
      </div>
      <div class="header-buttons">
        <router-link to="/charity/campaigns/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Campaign
        </router-link>
      </div>
    </div>

    <!-- Stats Cards -->
    <CampaignStatsCards :stats="stats" />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading campaigns...</p>
    </div>

    <div v-else>
      <!-- Filters -->
      <CampaignFiltersBar
        :filters="filters"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
      />

      <!-- Table -->
      <CampaignTable
        :campaigns="campaigns"
        :pagination="pagination"
        @edit="editCampaign"
        @extend="openExtendModal"
        @terminate="openTerminateModal"
        @change-status="openStatusModal"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Extend Modal -->
    <CampaignModals
      :show-extend-modal="showExtendModal"
      :show-terminate-modal="showTerminateModal"
      :campaign-to-modify="campaignToModify"
      :processing="processing"
      :toasts="toasts"
      @close-extend-modal="closeExtendModal"
      @confirm-extend="confirmExtend"
      @close-terminate-modal="closeTerminateModal"
      @confirm-terminate="confirmTerminate"
      @remove-toast="removeToast"
    />

    <!-- Change Status Modal -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal">
        <h3>Change Status for {{ campaignToModify?.title }}</h3>
        <p>Current: <strong>{{ getStatusLabel(campaignToModify?.status) }}</strong></p>
        <div class="form-group">
          <label>New Status</label>
          <select v-model="selectedNewStatus">
            <option value="">-- Choose --</option>
            <option v-for="s in allowedStatuses" :key="s" :value="s">
              {{ getStatusLabel(s) }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="closeStatusModal" class="btn-secondary">Cancel</button>
          <button @click="applyStatusChange" :disabled="!selectedNewStatus || savingStatus" class="btn-primary">
            {{ savingStatus ? 'Saving...' : 'Change Status' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import CharityService from '@/stores/charity'
import CampaignStatsCards from './components/Campaign/CampaignStatsCards.vue'
import CampaignFiltersBar from './components/Campaign/CampaignFiltersBar.vue'
import CampaignTable from './components/Campaign/CampaignTable.vue'
import CampaignModals from './components/Campaign/CampaignModals.vue'

const router = useRouter()

// State
const campaigns = ref([])
const loading = ref(false)
const processing = ref(false)

const stats = ref({
  total: 0,
  planned: 0,
  active: 0,
  completed: 0,
  cancelled: 0
})

const pagination = ref({ currentPage: 1, totalPages: 1 })

const filters = ref({
  status: '',
  category: '',
  search: ''
})

// Extend / Terminate modals
const showExtendModal = ref(false)
const showTerminateModal = ref(false)
const campaignToModify = ref(null)

// Change Status modal
const showStatusModal = ref(false)
const selectedNewStatus = ref('')
const savingStatus = ref(false)
const allowedStatuses = ref([])

// Toasts
const toasts = ref([])
let searchTimeout = null

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id) }

const getStatusLabel = (status) => CharityService.getStatusLabel(status)

// Load campaigns
const loadCampaigns = async () => {
  loading.value = true
  try {
    const params = {
      status: filters.value.status,
      category: filters.value.category,
      search: filters.value.search
    }
    const result = await CharityService.getCampaigns(params)
    if (result.success) {
      campaigns.value = result.data
      computeStats(result.data)
      pagination.value = { currentPage: 1, totalPages: Math.ceil(result.data.length / 10) || 1 }
    } else {
      addToast(result.error || 'Failed to load campaigns', 'error')
    }
  } catch (e) {
    addToast('Failed to load campaigns', 'error')
  } finally {
    loading.value = false
  }
}

const computeStats = (data) => {
  stats.value = {
    total: data.length,
    planned: data.filter(c => c.status === 'planned').length,
    active: data.filter(c => c.status === 'active').length,
    completed: data.filter(c => c.status === 'completed').length,
    cancelled: data.filter(c => c.status === 'cancelled').length
  }
}

const editCampaign = (c) => router.push(`/charity/campaigns/${c.campaignId}/edit`)

// Extend
const openExtendModal = (c) => { campaignToModify.value = c; showExtendModal.value = true }
const closeExtendModal = () => { showExtendModal.value = false; campaignToModify.value = null }
const confirmExtend = async ({ newEndDate, reason }) => {
  processing.value = true
  const res = await CharityService.extendCampaign(campaignToModify.value.campaignId, newEndDate, reason)
  processing.value = false
  if (res.success) {
    addToast('Campaign extended', 'success')
    closeExtendModal()
    loadCampaigns()
  } else {
    addToast(res.error || 'Extension failed', 'error')
  }
}

// Terminate
const openTerminateModal = (c) => { campaignToModify.value = c; showTerminateModal.value = true }
const closeTerminateModal = () => { showTerminateModal.value = false; campaignToModify.value = null }
const confirmTerminate = async (reason) => {
  processing.value = true
  const res = await CharityService.terminateCampaign(campaignToModify.value.campaignId, reason)
  processing.value = false
  if (res.success) {
    addToast('Campaign terminated', 'success')
    closeTerminateModal()
    loadCampaigns()
  } else {
    addToast(res.error || 'Termination failed', 'error')
  }
}

// Change Status
const openStatusModal = (campaign) => {
  campaignToModify.value = campaign
  const map = {
    planned: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['planned']
  }
  allowedStatuses.value = map[campaign.status] || []
  selectedNewStatus.value = ''
  showStatusModal.value = true
}

const closeStatusModal = () => {
  showStatusModal.value = false
  campaignToModify.value = null
}

const applyStatusChange = async () => {
  if (!selectedNewStatus.value || !campaignToModify.value) return

  // If marking as completed, ask for confirmation first
  if (selectedNewStatus.value === 'completed') {
    if (!window.confirm(
      `Are you sure you want to mark "${campaignToModify.value.title}" as completed? This action cannot be undone.`
    )) {
      return
    }
  }

  savingStatus.value = true
  const res = await CharityService.updateCampaign(campaignToModify.value.campaignId, {
    status: selectedNewStatus.value
  })
  savingStatus.value = false

  if (res.success) {
    addToast(`Campaign status changed to ${getStatusLabel(selectedNewStatus.value)}`)
    closeStatusModal()
    loadCampaigns()
  } else {
    addToast(res.error || 'Failed to change status', 'error')
  }
}

// Filters
const updateFilters = (newFilters) => { filters.value = { ...filters.value, ...newFilters } }
const clearFilters = () => { filters.value = { status: '', category: '', search: '' }; loadCampaigns() }
const goToPage = (page) => loadCampaigns()

watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadCampaigns(), 500)
})
watch([() => filters.value.status, () => filters.value.category], () => loadCampaigns())

onMounted(() => loadCampaigns())
</script>

<style scoped>
.campaigns-page {
  padding: 16px;
  min-height: 100vh;
  background: #f5f7fb;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }
.header-buttons { display: flex; gap: 12px; }
.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 10px; font-weight: 600;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white; text-decoration: none; font-size: 14px; border: none; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }
.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal styles */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: white; border-radius: 16px; padding: 24px;
  width: 400px; max-width: 90%;
}
.modal h3 { margin-bottom: 16px; color: #1e293b; }
.modal p { margin-bottom: 16px; color: #475569; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #475569; }
.form-group select {
  width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;
}
.modal-actions {
  display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;
}
.btn-secondary {
  padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer;
  font-weight: 500; color: #475569;
}
.btn-secondary:hover { background: #e2e8f0; }
.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none;
  padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer;
}
.btn-primary:hover { background: #5b0fb9; }

/* Toasts – if used */
.toast-container {
  position: fixed; bottom: 20px; right: 20px; z-index: 2000;
  display: flex; flex-direction: column; gap: 8px;
}
.toast {
  padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500;
  cursor: pointer; max-width: 350px;
}
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

@media (max-width: 768px) {
  .campaigns-page { padding: 12px; }
  .page-title { font-size: 20px; }
}
</style>