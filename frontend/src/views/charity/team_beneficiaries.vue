<template>
  <div class="team-beneficiaries-page">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/charity/teams" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </router-link>
        <div>
          <h1 class="page-title">{{ teamName }}</h1>
          <p class="page-subtitle">Members of this charity team and assigned beneficiaries</p>
        </div>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Assign Beneficiary
      </button>
    </div>

    <!-- Team Info Cards -->
    <StatsCards :cards="teamLeaderStats" />

    <!-- Filters & Actions -->
    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search beneficiaries in team..."
      @clear="filters.search = ''"
    />

    <!-- Beneficiaries Table -->
    <ListTable
      :columns="columns"
      :rows="filteredBeneficiaries"
      row-key="beneficiaryId"
      :loading="loading"
    >
      <template #cell-name="{ row }">
        <div class="ben-name-cell">
          <div class="ben-icon" :class="row.type">
            {{ row.type === 'individual' ? '👤' : '🏢' }}
          </div>
          <span>{{ row.name }}</span>
        </div>
      </template>

      <template #cell-location="{ row }">
        <span v-if="row.fullInfo?.location">
          {{ row.fullInfo.location.city }}, {{ row.fullInfo.location.region }}
        </span>
        <span v-else class="text-muted">—</span>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <button class="action-btn" title="Transfer" @click="openTransferModal(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6"/></svg>
          </button>
          <button class="action-btn delete" title="Remove from Team" @click="removeFromTeam(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </template>
    </ListTable>

    <!-- ── Modals ── -->
    <AssignBeneficiaryModal
      :is-open="showAddModal"
      :team-id="teamId"
      @close="showAddModal = false"
      @success="handleAssignSuccess"
    />

    <TransferBeneficiaryModal
      :is-open="showTransferModal"
      :beneficiary="selectedBen"
      :current-team-name="teamName"
      @close="showTransferModal = false; selectedBen = null"
      @success="handleTransferSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar from './components/common/FilterBar.vue'
import ListTable from './components/common/ListTable.vue'
import AssignBeneficiaryModal from './components/modals/beneficiaries/AssignBeneficiaryModal.vue'
import TransferBeneficiaryModal from './components/modals/beneficiaries/TransferBeneficiaryModal.vue'
import CharityService, { type CharityBeneficiary, type CharityTeam } from '@/stores/charity'

const route = useRoute()
const teamId = computed(() => Number(route.params.id))

const loading = ref(false)
const team = ref<CharityTeam | null>(null)
const beneficiaries = ref<CharityBeneficiary[]>([])
const filters = ref({ search: '' })

// Modal visibility
const showAddModal = ref(false)
const showTransferModal = ref(false)
const selectedBen = ref<CharityBeneficiary | null>(null)

const loadData = async () => {
  loading.value = true
  const [tRes, bRes] = await Promise.all([
    CharityService.getTeamById(teamId.value),
    CharityService.getBeneficiariesByTeam(teamId.value)
  ])
  if (tRes.success) team.value = tRes.data
  if (bRes.success) beneficiaries.value = bRes.data
  loading.value = false
}

onMounted(loadData)

const teamName = computed(() => team.value?.name || 'Loading...')

const columns = [
  { key: 'name', label: 'Beneficiary' },
  { key: 'type', label: 'Type', format: 'badge' },
  { key: 'location', label: 'Location' },
  { key: 'fullInfo.contact.phone', label: 'Contact', fallback: '—' }
]

const teamLeaderStats = computed(() => [
  { key: 'head', label: 'Team Head', value: team.value?.head ? `${team.value.head.firstName} ${team.value.head.lastName}` : '—', color: '#6a11cb' },
  { key: 'vice', label: 'Vice Head', value: team.value?.vice ? `${team.value.vice.firstName} ${team.value.vice.lastName}` : '—', color: '#7c3aed' },
  { key: 'members', label: 'Team Members', value: team.value?.members?.length || 0, color: '#f59e0b' }
])

const filteredBeneficiaries = computed(() => {
  if (!filters.value.search) return beneficiaries.value
  const q = filters.value.search.toLowerCase()
  return beneficiaries.value.filter(b => b.name.toLowerCase().includes(q))
})

const handleAssignSuccess = (count: number) => {
  alert(`Successfully assigned ${count} beneficiaries.`)
  loadData() 
}

const openTransferModal = (ben: CharityBeneficiary) => {
  selectedBen.value = ben
  showTransferModal.value = true
}

const handleTransferSuccess = (data: { beneficiaryName: string, targetTeamName: string }) => {
  alert(`Beneficiary "${data.beneficiaryName}" successfully transferred to "${data.targetTeamName}".`)
  loadData() // Refresh current team list (beneficiary should disappear from here)
}

const removeFromTeam = async (ben: CharityBeneficiary) => {
  if (confirm(`Remove ${ben.name} from this team?`)) {
    const res = await CharityService.updateBeneficiary(ben.beneficiaryId, { teamId: null })
    if (res.success) {
      beneficiaries.value = beneficiaries.value.filter(b => b.beneficiaryId !== ben.beneficiaryId)
    } else {
      alert('Failed to remove beneficiary.')
    }
  }
}
</script>

<style scoped>
.team-beneficiaries-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; background: white; border: 1px solid #e2e8f0;
  border-radius: 12px; color: #64748b; text-decoration: none;
}
.back-btn:hover { color: #6a11cb; border-color: #6a11cb; }
.page-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.ben-name-cell { display: flex; align-items: center; gap: 10px; }
.ben-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.ben-icon.individual { background: #eff6ff; }
.ben-icon.organization { background: #f5f3ff; }

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
.text-muted { color: #94a3b8; font-style: italic; }
</style>
