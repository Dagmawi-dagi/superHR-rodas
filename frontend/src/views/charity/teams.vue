<template>
  <div class="teams-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Charity Teams</h1>
        <p class="page-subtitle">Manage distribution teams, heads, and members</p>
      </div>
      <router-link to="/charity/teams/create" class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New Team
      </router-link>
    </div>

    <StatsCards :cards="statsCards" />

    <FilterBar
      v-model:search="filters.search"
      search-placeholder="Search teams..."
      @clear="clearFilters"
    >
      <template #actions>
        <button class="btn-outline" @click="refreshData">Refresh</button>
      </template>
    </FilterBar>

    <ListTable
      :columns="teamColumns"
      :rows="filteredTeams"
      row-key="teamId"
      :pagination="pagination"
      @page-change="onPageChange"
      @sort-change="onSort"
    >
      <template #cell-members="{ value }">
        <span class="members-badge">{{ value.length }} members</span>
      </template>
      <template #cell-head="{ row }">
        {{ row.head ? `${row.head.firstName} ${row.head.lastName}` : 'Not assigned' }}
      </template>
      <template #cell-vice="{ row }">
        {{ row.vice ? `${row.vice.firstName} ${row.vice.lastName}` : 'Not assigned' }}
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
      <!-- Actions – only Edit -->
      <template #actions="{ row }">
        <router-link :to="`/charity/teams/${row.teamId}/edit`" class="action-btn edit" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

const teamsData = [
  { teamId: 1, name: 'Team Alpha', head: { employeeId: 1, firstName: 'Abebe', lastName: 'Kebede' }, vice: { employeeId: 2, firstName: 'Birtukan', lastName: 'Alemu' }, members: [1,2,3], isActive: true },
  { teamId: 2, name: 'Team Beta', head: null, vice: null, members: [], isActive: true },
  { teamId: 3, name: 'Team Gamma', head: { employeeId: 5, firstName: 'Yohannes', lastName: 'Tesfaye' }, vice: null, members: [5], isActive: false },
]
const teams = ref(teamsData)
const filters = ref({ search: '' })
const filteredTeams = computed(() => {
  if (!filters.value.search) return teams.value
  const q = filters.value.search.toLowerCase()
  return teams.value.filter(t => t.name.toLowerCase().includes(q))
})
const clearFilters = () => { filters.value = { search: '' } }
const pagination = ref({ currentPage: 1, totalPages: 1, totalItems: 3, pageSize: 10 })
const onPageChange = (page) => { pagination.value.currentPage = page }
const onSort = ({ key, dir }) => { console.log('Sort:', key, dir) }
const statsCards = computed(() => [
  { key: 'total', label: 'Total Teams', value: teams.value.length },
  { key: 'active', label: 'Active Teams', value: teams.value.filter(t => t.isActive).length, color: '#10b981' },
  { key: 'members', label: 'Total Members', value: teams.value.reduce((s, t) => s + t.members.length, 0), color: '#3b82f6' },
])
const teamColumns = [
  { key: 'teamId', label: 'ID', width: '60px' },
  { key: 'name', label: 'Name' },
  { key: 'head', label: 'Team Head' },
  { key: 'vice', label: 'Vice Head' },
  { key: 'members', label: 'Members' },
  { key: 'isActive', label: 'Active' },
]
const toggleActive = (team) => { team.isActive = !team.isActive; alert(`Team "${team.name}" is now ${team.isActive ? 'active' : 'inactive'} (UI only)`) }
const refreshData = () => alert('Refresh — real data not connected')
onMounted(() => {})
</script>

<style scoped>
.teams-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.page-subtitle { font-size: 13px; color: #64748b; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn-icon { width: 18px; height: 18px; }
.members-badge { background: #e0e7ff; color: #3730a3; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.btn-outline { padding: 8px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; color: #475569; }
.lt-badge--active { background: #e6f7ee; color: #0d6b36; border: 1px solid #b7e4cf; }
.lt-badge--inactive { background: #fef1f1; color: #b91c1c; border: 1px solid #fecaca; }
</style>