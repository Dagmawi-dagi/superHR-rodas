<template>
  <div class="donations-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Donations</h1>
        <p class="page-subtitle">Manage and track all charity contributions and distributions</p>
      </div>
      <router-link to="/charity/donations/create" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New Donation
      </router-link>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="donationStats" />

    <!-- Filters -->
    <FilterBar
      v-model:search="filters.search"
      v-model:status="filters.status"
      search-placeholder="Search donations..."
      :status-options="[
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending Approval' },
        { value: 'approved', label: 'Approved' },
        { value: 'cancelled', label: 'Cancelled' }
      ]"
      @clear="resetFilters"
    >
      <template #filters>
        <select v-model="filters.teamId" class="fb-select">
          <option value="">All Teams</option>
          <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
        </select>
      </template>
    </FilterBar>

    <!-- Table -->
    <ListTable
      :columns="columns"
      :rows="filteredDonations"
      row-key="donationId"
      :loading="loading"
    >
      <template #cell-description="{ row }">
        <div class="desc-cell">
          <span class="main-desc">{{ row.description || 'No description' }}</span>
          <span class="team-tag" v-if="row.team">{{ row.team.name }}</span>
        </div>
      </template>

      <template #cell-totalValueInBirr="{ value }">
        <span class="amount-text">{{ formatCurrency(value) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <router-link :to="`/charity/donations/${row.donationId}`" class="action-btn" title="View Details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </router-link>
          <button v-if="row.status === 'draft'" class="action-btn success" title="Submit for Approval" @click="submitDonation(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
          <button v-if="row.status === 'draft'" class="action-btn" title="Edit" @click="editDonation(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </template>
    </ListTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar from './components/common/FilterBar.vue'
import ListTable from './components/common/ListTable.vue'
import CharityService, { type CharityDonation, type CharityTeam } from '@/stores/charity'

const router = useRouter()

const loading = ref(false)
const donations = ref<CharityDonation[]>([])
const teams = ref<CharityTeam[]>([])
const filters = ref({ search: '', status: '', teamId: '' })

const loadData = async () => {
  loading.value = true
  const [donRes, teamRes] = await Promise.all([
    CharityService.getDonations(),
    CharityService.getTeams()
  ])
  if (donRes.success) donations.value = donRes.data
  if (teamRes.success) teams.value = teamRes.data
  loading.value = false
}

onMounted(loadData)

const columns = [
  { key: 'donationId', label: 'ID', width: '70px' },
  { key: 'donationDeliveryDate', label: 'Delivery Date', format: 'date', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'totalValueInBirr', label: 'Total Value', sortable: true },
  { key: 'status', label: 'Status', format: 'badge' }
]

const donationStats = computed(() => [
  { key: 'total', label: 'Total Value', value: donations.value.reduce((s, d) => s + Number(d.totalValueInBirr), 0), format: 'currency', color: '#6a11cb' },
  { key: 'pending', label: 'Pending Approval', value: donations.value.filter(d => d.status === 'pending').length, color: '#f59e0b' },
  { key: 'approved', label: 'Total Approved', value: donations.value.filter(d => d.status === 'approved').length, color: '#10b981' }
])

const filteredDonations = computed(() => {
  let result = donations.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(d => d.description?.toLowerCase().includes(q))
  }
  if (filters.value.status) {
    result = result.filter(d => d.status === filters.value.status)
  }
  if (filters.value.teamId) {
    result = result.filter(d => d.teamId === Number(filters.value.teamId))
  }
  return result
})

const resetFilters = () => { filters.value = { search: '', status: '', teamId: '' } }

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val)
}

const editDonation = (d: any) => { router.push(`/charity/donations/${d.donationId}/edit`) }

const submitDonation = async (d: CharityDonation) => {
  if (!confirm(`Submit donation batch #${d.donationId} for approval?`)) return
  loading.value = true
  const res = await CharityService.submitDonation(d.donationId)
  if (res.success) {
    loadData()
  } else {
    alert(res.error || 'Failed to submit donation')
  }
  loading.value = false
}
</script>

<style scoped>
.donations-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; text-decoration: none;
}
.btn-icon { width: 18px; height: 18px; }

.fb-select {
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 13px; color: #475569; background: white; outline: none;
}
.fb-select:focus { border-color: #6a11cb; }

.desc-cell { display: flex; flex-direction: column; gap: 2px; }
.main-desc { font-weight: 600; color: #1e293b; }
.team-tag { font-size: 11px; color: #64748b; font-style: italic; }

.amount-text { font-weight: 700; color: #1e293b; }

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer; text-decoration: none;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.success:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }
</style>
