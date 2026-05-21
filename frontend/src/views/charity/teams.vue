<template>
  <div class="teams-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Charity Teams</h1>
        <p class="page-subtitle">Manage teams, assign leaders and monitor activities</p>
      </div>
      <router-link to="/charity/teams/create" class="btn-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        New Team
      </router-link>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="teamStats" />

    <!-- Filters and Actions -->
    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search teams..."
      @clear="resetFilters"
    />

    <!-- Teams Table -->
    <ListTable
      :columns="columns"
      :rows="filteredTeams"
      row-key="teamId"
      :loading="loading"
    >
      <template #cell-head="{ row }">
        <div class="employee-cell" v-if="row.head">
          <div class="emp-avatar">{{ row.head.firstName[0] }}{{ row.head.lastName[0] }}</div>
          <span>{{ row.head.firstName }} {{ row.head.lastName }}</span>
        </div>
        <span v-else class="text-muted">Not assigned</span>
      </template>

      <template #cell-vice="{ row }">
        <div class="employee-cell" v-if="row.vice">
          <div class="emp-avatar vice">{{ row.vice.firstName[0] }}{{ row.vice.lastName[0] }}</div>
          <span>{{ row.vice.firstName }} {{ row.vice.lastName }}</span>
        </div>
        <span v-else class="text-muted">Not assigned</span>
      </template>

      <template #cell-members="{ value }">
        <div class="members-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {{ value?.length || 0 }} members
        </div>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <button class="action-btn" title="View Team" @click="viewTeam(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <router-link :to="`/charity/teams/${row.teamId}/beneficiaries`" class="action-btn" title="Team Beneficiaries">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </router-link>
          <button class="action-btn" title="Edit" @click="editTeam(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn delete" :title="row.isActive ? 'Deactivate' : 'Activate'" @click="toggleStatus(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" cy="2" x2="12" y2="12"/></svg>
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
import CharityService, { type CharityTeam } from '@/stores/charity'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const teams = ref<CharityTeam[]>([])
const filters = ref({ search: '' })

const loadTeams = async () => {
  loading.value = true
  const res = await CharityService.getTeams()
  if (res.success) {
    teams.value = res.data
  }
  loading.value = false
}

onMounted(loadTeams)

const columns = [
  { key: 'name', label: 'Team Name', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'head', label: 'Team Head' },
  { key: 'vice', label: 'Vice Head' },
  { key: 'members', label: 'Members' },
  { key: 'isActive', label: 'Status', format: 'boolean', trueLabel: 'Active', falseLabel: 'Inactive' }
]

const teamStats = computed(() => [
  { key: 'total', label: 'Total Teams', value: teams.value.length, color: '#6a11cb' },
  { key: 'active', label: 'Active Teams', value: teams.value.filter(t => t.isActive).length, color: '#10b981' },
  { key: 'total_members', label: 'Total Members', value: teams.value.reduce((s, t) => s + (t.members?.length || 0), 0), color: '#f59e0b' }
])

const filteredTeams = computed(() => {
  if (!filters.value.search) return teams.value
  const q = filters.value.search.toLowerCase()
  return teams.value.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description?.toLowerCase().includes(q)
  )
})

const resetFilters = () => { filters.value.search = '' }

const toggleStatus = (team: any) => {
  team.isActive = !team.isActive
  alert(`Team ${team.name} is now ${team.isActive ? 'Active' : 'Inactive'}`)
}

const viewTeam = (team: CharityTeam) => {
  router.push(`/charity/teams/${team.teamId}`)
}

const editTeam = (team: CharityTeam) => {
  router.push(`/charity/teams/${team.teamId}/edit`)
}
</script>

<style scoped>
.teams-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; text-decoration: none;
}
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(106, 17, 203, 0.2); }
.btn-icon { width: 18px; height: 18px; }

.employee-cell { display: flex; align-items: center; gap: 10px; }
.emp-avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #e0e7ff; color: #4338ca;
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
}
.emp-avatar.vice { background: #fef3c7; color: #b45309; }

.members-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; background: #f1f5f9; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #475569;
}
.icon-sm { width: 14px; height: 14px; }

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; text-decoration: none;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

.text-muted { color: #94a3b8; font-style: italic; font-size: 13px; }
</style>
