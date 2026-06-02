<template>
  <div class="team-beneficiaries-page">
    <div class="page-header" v-if="team">
      <div class="header-left">
        <router-link to="/charity/teams" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </router-link>
        <div>
          <h1 class="page-title">{{ team.name }}</h1>
          <p class="page-subtitle">Assigned beneficiaries for this charity team</p>
        </div>
      </div>
      <router-link :to="{ name: 'charity-beneficiaries-create', query: { teamId: team.teamId } }" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add Beneficiary
      </router-link>
    </div>

    <div v-if="loading && !team" class="loading-state">Loading team data...</div>
    <div v-else-if="error" class="error-alert">{{ error }} <button @click="loadData">Retry</button></div>

    <template v-else-if="team">
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
        <template #cell-fullname="{ row }">
          <div class="ben-name-cell">
            <span class="ben-avatar-small">{{ row.fullname[0] }}</span>
            <span>{{ row.fullname }}</span>
          </div>
        </template>

        <template #cell-location="{ row }">
          <span v-if="row.fullInfo?.location?.city">
            {{ row.fullInfo.location.city }}, {{ row.fullInfo.location.region }}
          </span>
          <span v-else class="text-muted">—</span>
        </template>

        <template #cell-monthlyAllocation="{ value }">
          <strong>{{ CharityService.formatCurrency(value) }}</strong>
        </template>

        <template #actions="{ row }">
          <div class="table-actions">
            <router-link :to="`/charity/beneficiaries/${row.beneficiaryId}/details`" class="action-btn" title="View Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none"/></svg>
            </router-link>
            <button class="action-btn" title="Transfer" @click="openTransferModal(row)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6"/></svg>
            </button>
          </div>
        </template>
      </ListTable>
    </template>

    <TransferBeneficiaryModal
      :is-open="showTransferModal"
      :beneficiary="selectedBen"
      :current-team-name="team?.name || ''"
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
import TransferBeneficiaryModal from './components/modals/beneficiaries/TransferBeneficiaryModal.vue'
import CharityService, { type CharityBeneficiary, type CharityTeam } from '@/stores/charity'

const route = useRoute()
const teamId = computed(() => Number(route.params.id))

const loading = ref(false)
const error = ref<string | null>(null)
const team = ref<CharityTeam | null>(null)
const beneficiaries = ref<CharityBeneficiary[]>([])
const filters = ref({ search: '' })

// Modal visibility
const showTransferModal = ref(false)
const selectedBen = ref<CharityBeneficiary | null>(null)

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [tRes, bRes] = await Promise.all([
      CharityService.getTeamById(teamId.value),
      CharityService.getBeneficiaries({ teamId: teamId.value, size: 500 })
    ])
    if (tRes.success) team.value = tRes.data
    else error.value = tRes.error
    
    if (bRes.success) beneficiaries.value = bRes.data
  } catch (err) {
    error.value = 'Failed to load team data'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const columns = [
  { key: 'fullname', label: 'Beneficiary' },
  { key: 'monthlyAllocation', label: 'Allocation' },
  { key: 'paymentMethod', label: 'Payment', format: 'badge' },
  { key: 'location', label: 'Location' }
]

const teamLeaderStats = computed(() => [
  { key: 'head', label: 'Team Head', value: team.value?.headMember ? `${team.value.headMember.firstName} ${team.value.headMember.lastName}` : '—', color: '#6a11cb' },
  { key: 'vice', label: 'Vice Head', value: team.value?.viceMember ? `${team.value.viceMember.firstName} ${team.value.viceMember.lastName}` : '—', color: '#7c3aed' },
  { key: 'members', label: 'Total Beneficiaries', value: beneficiaries.value.length, color: '#10b981' }
])

const filteredBeneficiaries = computed(() => {
  if (!filters.value.search) return beneficiaries.value
  const q = filters.value.search.toLowerCase()
  return beneficiaries.value.filter(b => b.fullname.toLowerCase().includes(q))
})

const openTransferModal = (ben: CharityBeneficiary) => {
  selectedBen.value = ben
  showTransferModal.value = true
}

const handleTransferSuccess = (data: { beneficiary: CharityBeneficiary, targetTeamName: string }) => {
  alert(`Beneficiary "${data.beneficiary.fullname}" successfully transferred to "${data.targetTeamName}".`)
  loadData() 
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
  cursor: pointer; text-decoration: none;
}

.ben-name-cell { display: flex; align-items: center; gap: 10px; }
.ben-avatar-small {
  width: 32px; height: 32px; border-radius: 8px; background: #f5f3ff; color: #6a11cb;
  display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700;
}

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer; text-decoration: none;
}
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.text-muted { color: #94a3b8; font-style: italic; }

.loading-state { padding: 40px; text-align: center; color: #64748b; }
.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 16px; border-radius: 12px; text-align: center; }
.error-alert button { margin-top: 8px; padding: 6px 16px; background: #b91c1c; color: white; border: none; border-radius: 6px; cursor: pointer; }
</style>
