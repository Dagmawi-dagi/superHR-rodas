<template>
  <div class="beneficiaries-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Beneficiaries</h1>
        <p class="page-subtitle">Track and manage individuals and organizations receiving support</p>
      </div>
      <router-link to="/charity/beneficiaries/create" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Beneficiary
      </router-link>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="beneficiaryStats" />

    <!-- Filters -->
    <FilterBar
      v-model:search="filters.search"
      v-model:status="filters.type"
      search-placeholder="Search beneficiaries..."
      :status-options="[
        { value: 'individual', label: 'Individuals' },
        { value: 'organization', label: 'Organizations' }
      ]"
      @clear="resetFilters"
    />

    <!-- Table -->
    <ListTable
      :columns="columns"
      :rows="filteredBeneficiaries"
      row-key="beneficiaryId"
      :loading="loading"
    >
      <template #cell-name="{ row }">
        <div class="name-cell">
          <div class="type-icon" :class="row.type">
            <svg v-if="row.type === 'individual'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div class="name-info">
            <span class="full-name">{{ row.name }}</span>
            <span class="sub-info">{{ row.fullInfo?.contact?.phone || 'No phone' }}</span>
          </div>
        </div>
      </template>

      <template #cell-location="{ row }">
        <span class="location-text" v-if="row.fullInfo?.location">
          {{ row.fullInfo.location.city }}, {{ row.fullInfo.location.region }}
        </span>
        <span v-else class="text-muted">—</span>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <button class="action-btn" title="View" @click="viewBeneficiary(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="action-btn" title="Edit" @click="editBeneficiary(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn delete" :title="row.isActive ? 'Deactivate' : 'Activate'" @click="toggleStatus(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </button>
        </div>
      </template>
    </ListTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar from './components/common/FilterBar.vue'
import ListTable from './components/common/ListTable.vue'
import CharityService, { type CharityBeneficiary } from '@/stores/charity'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const beneficiaries = ref<CharityBeneficiary[]>([])
const filters = ref({ search: '', type: '' })

const loadBeneficiaries = async () => {
  loading.value = true
  const res = await CharityService.getBeneficiaries()
  if (res.success) {
    beneficiaries.value = res.data
  }
  loading.value = false
}

onMounted(loadBeneficiaries)

const columns = [
  { key: 'name', label: 'Beneficiary Name', sortable: true },
  { key: 'type', label: 'Category', format: 'badge' },
  { key: 'team.name', label: 'Assigned Team' },
  { key: 'location', label: 'Location' },
  { key: 'isActive', label: 'Status', format: 'boolean', trueLabel: 'Active', falseLabel: 'Inactive' }
]

const beneficiaryStats = computed(() => [
  { key: 'total', label: 'Total Beneficiaries', value: beneficiaries.value.length, color: '#6a11cb' },
  { key: 'indiv', label: 'Individuals', value: beneficiaries.value.filter(b => b.type === 'individual').length, color: '#3b82f6' },
  { key: 'orgs', label: 'Organizations', value: beneficiaries.value.filter(b => b.type === 'organization').length, color: '#8b5cf6' }
])

const filteredBeneficiaries = computed(() => {
  let result = beneficiaries.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(b => b.name.toLowerCase().includes(q))
  }
  if (filters.value.type) {
    result = result.filter(b => b.type === filters.value.type)
  }
  return result
})

const resetFilters = () => { filters.value.search = ''; filters.value.type = '' }

const viewBeneficiary = (ben: CharityBeneficiary) => {
  router.push(`/charity/beneficiaries/${ben.beneficiaryId}`)
}

const editBeneficiary = (ben: CharityBeneficiary) => {
  router.push(`/charity/beneficiaries/${ben.beneficiaryId}/edit`)
}

const toggleStatus = (ben: CharityBeneficiary) => {
  ben.isActive = !ben.isActive
  alert(`Beneficiary ${ben.name} is now ${ben.isActive ? 'Active' : 'Inactive'}`)
}
</script>

<style scoped>
.beneficiaries-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
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

.name-cell { display: flex; align-items: center; gap: 12px; }
.type-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.type-icon svg { width: 20px; height: 20px; }
.type-icon.individual { background: #eff6ff; color: #3b82f6; }
.type-icon.organization { background: #f5f3ff; color: #8b5cf6; }

.name-info { display: flex; flex-direction: column; }
.full-name { font-weight: 600; color: #1e293b; font-size: 14px; }
.sub-info { font-size: 12px; color: #94a3b8; }

.location-text { color: #475569; font-size: 14px; }

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.text-muted { color: #94a3b8; font-style: italic; }
</style>
