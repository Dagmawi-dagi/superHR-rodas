<template>
  <div class="beneficiaries-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Beneficiaries</h1>
        <p class="page-subtitle">Manage all registered beneficiaries</p>
      </div>
      <router-link to="/charity/beneficiaries/create" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Add Beneficiary
      </router-link>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="statsCards" />

    <!-- Filters -->
    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search beneficiaries…"
      @clear="clearFilters"
    >
      <template #filters>
        <select v-model="filters.teamId" class="fb-select">
          <option value="">All Teams</option>
          <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
        </select>
      </template>
      <template #actions>
        <button class="btn-outline" @click="refreshData">Refresh</button>
      </template>
    </FilterBar>

    <!-- Table -->
    <ListTable
      :columns="benColumns"
      :rows="filteredBeneficiaries"
      row-key="beneficiaryId"
      :pagination="pagination"
      @page-change="onPageChange"
      @sort-change="onSort"
    >
      <template #cell-monthlyAllocation="{ value }">
        <span class="amount-text">{{ formatCurrency(value) }}</span>
      </template>
      <template #cell-team="{ row }">
        {{ row.team ? row.team.name : '—' }}
      </template>
      <template #cell-paymentMethod="{ value }">
        <span :class="['lt-badge', `lt-badge--${value}`]">{{ value }}</span>
      </template>
      <template #cell-isActive="{ row }">
        <span
          :class="['lt-badge', row.isActive ? 'lt-badge--active' : 'lt-badge--inactive']"
          style="cursor:pointer; user-select:none"
          @click.stop="toggleActive(row)"
          :title="row.isActive ? 'Click to deactivate' : 'Click to activate'"
        >
          {{ row.isActive ? 'Active' : 'Inactive' }}
        </span>
      </template>
      <!-- Actions – Edit and Details -->
      <template #actions="{ row }">
        <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/edit`" class="action-btn edit" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </router-link>
        <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/details`" class="action-btn details" title="Details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"/></svg>
        </router-link>
      </template>
    </ListTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar   from './components/common/FilterBar.vue'
import ListTable   from './components/common/ListTable.vue'

const beneficiariesData = [
  { beneficiaryId: 1, name: 'Abebe Kebede', team: { teamId: 1, name: 'Team Alpha' }, monthlyAllocation: 1500, paymentMethod: 'bank', isActive: true },
  { beneficiaryId: 2, name: 'Mekedonia Association', team: null, monthlyAllocation: 5000, paymentMethod: 'cash', isActive: true },
  { beneficiaryId: 3, name: 'Zelalem Worku', team: { teamId: 2, name: 'Team Beta' }, monthlyAllocation: 800, paymentMethod: 'bank', isActive: false },
]
const beneficiaries = ref(beneficiariesData)
const teams = ref([{ teamId: 1, name: 'Team Alpha' }, { teamId: 2, name: 'Team Beta' }])
const filters = ref({ search: '', teamId: '' })
const filteredBeneficiaries = computed(() => {
  let list = beneficiaries.value
  if (filters.value.search) { const q = filters.value.search.toLowerCase(); list = list.filter(b => b.name.toLowerCase().includes(q)) }
  if (filters.value.teamId) list = list.filter(b => b.team?.teamId === Number(filters.value.teamId))
  return list
})
const clearFilters = () => { filters.value = { search: '', teamId: '' } }
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 3, pageSize: 10 })
const onPageChange = (page) => { pagination.value.currentPage = page }
const onSort = ({ key, dir }) => { console.log('Sort:', key, dir) }
const statsCards = computed(() => [
  { key: 'total', label: 'Total Beneficiaries', value: beneficiaries.value.length },
  { key: 'active', label: 'Active', value: beneficiaries.value.filter(b => b.isActive).length, color: '#10b981' },
  { key: 'allocated', label: 'Total Allocated (ETB)', value: beneficiaries.value.reduce((s, b) => s + b.monthlyAllocation, 0), format: 'currency' },
  { key: 'teams', label: 'Assigned Teams', value: new Set(beneficiaries.value.filter(b => b.team).map(b => b.team.teamId)).size, color: '#3b82f6' },
])
const benColumns = [
  { key: 'beneficiaryId', label: 'ID', width: '60px' },
  { key: 'name', label: 'Name' },
  { key: 'team', label: 'Team' },
  { key: 'monthlyAllocation', label: 'Monthly Allocation', format: 'currency', sortable: true },
  { key: 'paymentMethod', label: 'Payment', format: 'badge' },
  { key: 'isActive', label: 'Active' },
]
const toggleActive = (row) => { row.isActive = !row.isActive; alert(`Beneficiary "${row.name}" is now ${row.isActive ? 'active' : 'inactive'} (UI only)`) }
const refreshData = () => alert('Refresh — real data not connected')
function formatCurrency(val) { return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val ?? 0) }
onMounted(() => {})
</script>

<style scoped>
.beneficiaries-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn-icon { width: 18px; height: 18px; }
.fb-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; font-size: 13px; color: #475569; outline: none; }
.amount-text { font-weight: 600; color: #1e293b; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; margin-right: 6px; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.details:hover { border-color: #10b981; color: #10b981; background: #e6f7ee; }
.btn-outline { padding: 8px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; color: #475569; }
.lt-badge--active { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; }
.lt-badge--inactive { background: #fef1f1; color: #b91c1c; border: 1px solid #fecaca; }
</style>