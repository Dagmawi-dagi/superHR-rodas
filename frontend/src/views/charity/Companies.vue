<template>
  <div class="companies-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Company Management</h1>
        <p class="page-subtitle">Manage donor companies and partners</p>
      </div>
      <div class="header-buttons">
        <router-link to="/charity/companies/create" class="btn-primary">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Company
        </router-link>
      </div>
    </div>  

    <!-- Stats Cards -->
    <CompanyStatsCards :stats="stats" />

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading companies...</p>
    </div>

    <div v-else>
      <!-- Filters -->
      <CompanyFiltersBar
        :filters="filters"
        @update:filters="updateFilters"
        @clear-filters="clearFilters"
      />

      <!-- Table -->
      <CompanyTable
        :companies="companies"
        :pagination="pagination"
        @view="viewCompany"
        @edit="editCompany"
        @toggle-status="toggleStatus"
        @go-to-page="goToPage"
        @clear-filters="clearFilters"
      />

    </div>

    <!-- Toggle Status Modal (optional) -->
    <div v-if="showToggleModal" class="modal-overlay" @click.self="closeToggleModal">
      <div class="modal">
        <h3>{{ toggleAction === 'deactivate' ? 'Deactivate' : 'Activate' }} Company</h3>
        <p>Are you sure you want to {{ toggleAction }} <strong>{{ companyToToggle?.name }}</strong>?</p>
        <div class="modal-actions">
          <button @click="closeToggleModal" class="btn-secondary">Cancel</button>
          <button @click="confirmToggle" class="btn-primary" :disabled="toggling">
            {{ toggling ? 'Processing...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <EditCompanyModal
      v-if="showEditModal"
      :company="editingCompany"
      :saving="savingEdit"
      @close="closeEditModal"
      @save="saveEdit"
    />
    

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]" @click="removeToast(toast.id)">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import CharityService from '@/stores/charity'
import CompanyStatsCards from './components/Company/CompanyStatsCards.vue'
import CompanyFiltersBar from './components/Company/CompanyFiltersBar.vue'
import CompanyTable from './components/Company/CompanyTable.vue'
import EditCompanyModal from './components/Company/EditCompanyModal.vue'

const router = useRouter()
const companies = ref([])
const loading = ref(false)
const toggling = ref(false)
const showEditModal = ref(false)
const editingCompany = ref(null)
const savingEdit = ref(false)



const stats = ref({
  total: 0,
  active: 0,
  inactive: 0,
  main: 0,
  sister: 0,
  partner: 0
})

const pagination = ref({
  currentPage: 1,
  totalPages: 1
})

const filters = ref({
  type: '',
  isActive: '',
  search: ''
})

// Toggle modal
const showToggleModal = ref(false)
const companyToToggle = ref(null)
const toggleAction = ref('')

// Toasts
const toasts = ref([])
let searchTimeout = null

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Load companies
const loadCompanies = async () => {
  loading.value = true
  try {
    const params = {
      type: filters.value.type,
      isActive: filters.value.isActive,
      search: filters.value.search
    }
    const result = await CharityService.getCompanies(params)
    if (result.success) {
      companies.value = result.data
      computeStats(result.data)
      // Simple pagination (if your API returns pagination, adjust)
      pagination.value = {
        currentPage: 1,
        totalPages: Math.ceil(result.data.length / 10) || 1
      }
    } else {
      addToast(result.error || 'Failed to load companies', 'error')
    }
  } catch (e) {
    addToast('Failed to load companies', 'error')
  } finally {
    loading.value = false
  }
}

const computeStats = (data) => {
  stats.value = {
    total: data.length,
    active: data.filter(c => c.isActive).length,
    inactive: data.filter(c => !c.isActive).length,
    main: data.filter(c => c.type === 'main').length,
    sister: data.filter(c => c.type === 'sister').length,
    partner: data.filter(c => c.type === 'partner').length
  }
}

const viewCompany = (company) => router.push(`/charity/companies/${company.companyId}`)
const editCompany = (company) => {
  editingCompany.value = company
  showEditModal.value = true
}
const closeEditModal = () => {
  showEditModal.value = false
  editingCompany.value = null
}
const saveEdit = async (data) => {
  if (!editingCompany.value) return
  savingEdit.value = true
  const res = await CharityService.updateCompany(editingCompany.value.companyId, data)
  savingEdit.value = false
  if (res.success) {
    addToast(`Company "${data.name}" updated successfully`)
    closeEditModal()
    loadCompanies()
  } else {
    addToast(res.error || 'Update failed', 'error')
  }
}



const toggleStatus = (company) => {
  companyToToggle.value = company
  toggleAction.value = company.isActive ? 'deactivate' : 'activate'
  showToggleModal.value = true
}

const confirmToggle = async () => {
  toggling.value = true
  const res = await CharityService.updateCompany(companyToToggle.value.companyId, {
    isActive: !companyToToggle.value.isActive
  })
  toggling.value = false
  if (res.success) {
    addToast(`Company ${companyToToggle.value.isActive ? 'deactivated' : 'activated'}`, 'success')
    closeToggleModal()
    loadCompanies()
  } else {
    addToast(res.error || 'Toggle failed', 'error')
  }
}

const closeToggleModal = () => {
  showToggleModal.value = false
  companyToToggle.value = null
}

const clearFilters = () => {
  filters.value = { type: '', isActive: '', search: '' }
  loadCompanies()
}

const updateFilters = (newFilters) => {
  filters.value = { ...filters.value, ...newFilters }
}

const goToPage = (page) => {
  // simple page if using frontend pagination – adjust if API paginated
  // for now, just reload
  loadCompanies()
}

watch(() => filters.value.search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadCompanies(), 500)
})

watch([() => filters.value.type, () => filters.value.isActive], () => loadCompanies())

onMounted(() => loadCompanies())
</script>

<style scoped>
.companies-page {
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

.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; color: #1e293b; }
.modal p { margin-bottom: 24px; color: #475569; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
.btn-secondary { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; }
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; max-width: 350px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@media (max-width: 768px) { .companies-page { padding: 12px; } .page-title { font-size: 20px; } }
</style>