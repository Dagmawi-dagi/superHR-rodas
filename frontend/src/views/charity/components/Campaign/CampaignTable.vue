<template>
  <div class="table-container">
    <table class="campaign-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Dates</th>
          <th>Target</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in campaigns" :key="c.campaignId">
          <td class="title-cell">{{ c.title }}</td>
          <td>{{ c.category || 'N/A' }}</td>
          <td class="date-cell">
            <span v-if="c.startDate">{{ formatDate(c.startDate) }}</span>
            <span v-else>?</span>
            -
            <span v-if="c.endDate">{{ formatDate(c.endDate) }}</span>
            <span v-else>?</span>
          </td>
          <td class="amount-cell">{{ formatCurrency(c.targetAmount) }}</td>
          <td>
            <span :class="['status-badge', `status-${c.status}`]">
              {{ getStatusLabel(c.status) }}
            </span>
          </td>
          <td class="actions-cell">
            <button class="action-btn edit" @click="$emit('edit', c)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
            </button>
            <button v-if="c.status === 'active'" class="action-btn extend" @click="$emit('extend', c)" title="Extend">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            </button>
            <!-- <button v-if="c.status === 'active' || c.status === 'planned'" class="action-btn terminate" @click="$emit('terminate', c)" title="Terminate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </button> -->
            <!-- NEW: Change Status button -->
            <button
              v-if="getAllowedTransitions(c.status).length > 0"
              class="action-btn change-status"
              @click="$emit('change-status', c)"
              title="Change Status"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </button>
          </td>
        </tr>
        <tr v-if="campaigns.length === 0">
          <td colspan="6" class="empty-state">
            <div class="empty-state-content">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
              <h3>No campaigns found</h3>
              <p>Try adjusting your search or filter</p>
              <button @click="$emit('clear-filters')">Clear Filters</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="pagination.totalPages > 1" class="pagination">
      <!-- You can add pagination controls if needed -->
    </div>
  </div>
</template>

<script setup>
import CharityService from '@/stores/charity'

const props = defineProps({
  campaigns: { type: Array, default: () => [] },
  pagination: { type: Object, default: () => ({ currentPage: 1, totalPages: 1 }) }
})
defineEmits(['view', 'edit', 'extend', 'terminate', 'go-to-page','change-status', 'clear-filters'])

const getStatusLabel = (s) => CharityService.getStatusLabel(s)
const formatCurrency = (val) => val ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(val) : 'N/A'
const formatDate = (d) => d ? new Date(d).toLocaleDateString() : ''

// Allowed transitions based on current status
const getAllowedTransitions = (status) => {
  const map = {
    planned: ['active', 'cancelled'],
    active: ['completed', 'cancelled'],
    completed: [],               // maybe allow 'active'?
    cancelled: ['planned']
  }
  return map[status] || []
}
</script>

<style scoped>
.table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.campaign-table { width: 100%; border-collapse: collapse; min-width: 750px; }
.campaign-table th, .campaign-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.campaign-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
.title-cell { font-weight: 600; color: #1e293b; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.date-cell { white-space: nowrap; font-size: 13px; color: #475569; }
.amount-cell { font-weight: 600; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.status-planned { background: #e0e7ff; color: #3730a3; }
.status-active { background: #dcfce7; color: #15803d; }
.status-completed { background: #dbeafe; color: #1e40af; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }
.actions-cell { display: flex; gap: 6px; }
.action-btn { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #64748b; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.view { background: #10b98120; color: #10b981; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.extend { background: #f59e0b20; color: #d97706; }
.action-btn.terminate { background: #ef444420; color: #dc2626; }
.empty-state { text-align: center; padding: 60px; color: #94a3b8; }
.empty-state-content svg { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-state-content h3 { font-size: 16px; margin-bottom: 8px; }
.empty-state-content button { margin-top: 12px; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; }
.action-btn.change-status {
  background: #8b5cf620;
  color: #7c3aed;
}
</style>