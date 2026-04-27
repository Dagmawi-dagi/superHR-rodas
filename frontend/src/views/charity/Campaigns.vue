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
        @view="viewCampaign"
        @edit="editCampaign"
        @extend="openExtendModal"
        @terminate="openTerminateModal"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />
    </div>

    <!-- Modals -->
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

// Modals
const showExtendModal = ref(false)
const showTerminateModal = ref(false)
const campaignToModify = ref(null)

// Toasts
const toasts = ref([])
let searchTimeout = null

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id) }

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
      // Simple pagination if needed
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

// const viewCampaign = (c) => router.push(`/charity/campaigns/${c.campaignId}`)
const editCampaign = (c) => router.push(`/charity/campaigns/${c.campaignId}/edit`)

// Extend
const openExtendModal = (c) => {
  campaignToModify.value = c
  showExtendModal.value = true
}
const closeExtendModal = () => {
  showExtendModal.value = false
  campaignToModify.value = null
}
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
const openTerminateModal = (c) => {
  campaignToModify.value = c
  showTerminateModal.value = true
}
const closeTerminateModal = () => {
  showTerminateModal.value = false
  campaignToModify.value = null
}
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

// Filters
const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
}
const clearFilters = () => {
  filters.value = { status: '', category: '', search: '' }
  loadCampaigns()
}
const goToPage = (page) => loadCampaigns()

// Watchers
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
  color: white; text-decoration: none; font-size: 14px;
}
.btn-icon { width: 18px; height: 18px; }
.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .campaigns-page { padding: 12px; }
  .page-title { font-size: 20px; }
}
</style>