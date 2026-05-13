<template>
  <div class="table-container">
    <table class="groups-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Head</th>
          <th>Vice Head</th>
          <th>Members</th>
          <th>Beneficiaries</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="group in groups" :key="group.groupId">
          <td class="name-cell">
            <div class="name-wrapper">
              <span class="group-name">{{ group.name }}</span>
              <span class="group-desc">{{ group.description || 'No description' }}</span>
            </div>
          </td>
          <td>
            <div v-if="group.head" class="person-info">
              <span class="person-name">{{ group.head.firstName }} {{ group.head.lastName }}</span>
            </div>
            <span v-else class="text-muted">Not assigned</span>
          </td>
          <td>
            <div v-if="group.viceHead" class="person-info">
              <span class="person-name">{{ group.viceHead.firstName }} {{ group.viceHead.lastName }}</span>
            </div>
            <span v-else class="text-muted">Not assigned</span>
          </td>
          <td>
            <span class="badge-count">{{ (group.members || []).length }}</span>
          </td>
          <td>
            <span class="badge-count primary">{{ (group.beneficiaries || []).length }}</span>
          </td>
          <td>
            <span :class="['status-badge', group.isActive ? 'active' : 'inactive']">
              {{ group.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td class="actions-cell">
            <router-link :to="`/charity/groups/${group.groupId}/beneficiaries`" class="action-btn view" title="View Beneficiaries">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </router-link>
            <button class="action-btn edit" @click="$emit('edit', group)" title="Edit Group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button v-if="group.isActive" class="action-btn delete" @click="$emit('deactivate', group)" title="Deactivate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  groups: { type: Array, default: () => [] }
});
defineEmits(['edit', 'deactivate']);
</script>

<style scoped>
.table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.groups-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.groups-table th, .groups-table td { padding: 16px; text-align: left; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.groups-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
.groups-table td { font-size: 14px; color: #1e293b; }

.name-wrapper { display: flex; flex-direction: column; gap: 4px; }
.group-name { font-weight: 600; color: #1e293b; }
.group-desc { font-size: 12px; color: #64748b; line-height: 1.4; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.person-info { display: flex; flex-direction: column; }
.person-name { font-weight: 500; }
.text-muted { color: #94a3b8; font-style: italic; font-size: 13px; }

.badge-count { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 8px; border-radius: 12px; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; }
.badge-count.primary { background: #e0f2fe; color: #0369a1; }

.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #fee2e2; color: #991b1b; }

.actions-cell { display: flex; gap: 8px; }
.action-btn { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid transparent; background: #f8fafc; color: #64748b; transition: all 0.2s; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { background: white; border-color: #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.action-btn.view { color: #3b82f6; }
.action-btn.view:hover { background: #eff6ff; border-color: #bfdbfe; }
.action-btn.edit { color: #10b981; }
.action-btn.edit:hover { background: #f0fdf4; border-color: #bbf7d0; }
.action-btn.delete { color: #ef4444; }
.action-btn.delete:hover { background: #fef2f2; border-color: #fecaca; }
</style>
