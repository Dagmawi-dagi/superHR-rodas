<template>
  <div class="adjustments-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Approval Requests</h1>
        <p class="page-subtitle">Review and manage charity actions requiring sign-off</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <StatsCards :cards="approvalStats" />

    <!-- Filters -->
    <FilterBar
      v-model:search="filters.search"
      v-model:status="filters.status"
      search-placeholder="Search requests..."
      :status-options="[
        { value: 'pending', label: 'Pending Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'commented', label: 'Clarification' }
      ]"
      @clear="resetFilters"
    >
      <template #filters>
        <select v-model="filters.action" class="fb-select">
          <option value="">All Actions</option>
          <option value="NewBeneficiary">New Beneficiary</option>
          <option value="NewCharityTeam">New Team</option>
          <option value="Transfer">Item Transfer</option>
          <option value="TransferBeneficiary">Team Transfer</option>
          <option value="Deduct">Deduction</option>
          <option value="Increase">Increase</option>
          <option value="Return">Return</option>
        </select>
      </template>
    </FilterBar>

    <!-- Table -->
    <ListTable
      :columns="columns"
      :rows="filteredApprovals"
      row-key="requestId"
      :loading="loading"
    >
      <template #cell-action="{ value }">
        <span class="action-pill" :class="value.toLowerCase()">
          {{ value.replace(/([A-Z])/g, ' $1').trim() }}
        </span>
      </template>

      <template #cell-requester="{ row }">
        <div class="requester-info">
          <span class="req-name">{{ row.requester?.fullName }}</span>
          <span class="req-date">{{ formatDate(row.created_at) }}</span>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="table-actions">
          <button v-if="isCharityAdmin && (row.status === 'pending' || row.status === 'commented')" class="action-btn approve" title="Approve" @click="handleApprove(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button v-if="isCharityAdmin && (row.status === 'pending' || row.status === 'commented')" class="action-btn comment" title="Add Comment / Clarify" @click="openCommentModal(row, 'comment')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button v-if="isCharityAdmin && (row.status === 'pending' || row.status === 'commented')" class="action-btn reject" title="Reject" @click="openCommentModal(row, 'reject')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
          </button>
          <button class="action-btn" title="View Detail" @click="viewDetail(row)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>
      </template>
    </ListTable>

    <AdjustmentDetailModal
      v-if="selectedRequest"
      :is-open="!!selectedRequest"
      :request="selectedRequest"
      @close="selectedRequest = null"
    />

    <CommentModal
      v-if="actionModal.show"
      :is-open="actionModal.show"
      :type="actionModal.type"
      :processing="processing"
      @close="actionModal.show = false"
      @submit="handleActionSubmit"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import StatsCards from './components/common/StatsCards.vue'
import FilterBar from './components/common/FilterBar.vue'
import ListTable from './components/common/ListTable.vue'
import CharityService, { type CharityRequestApprove } from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'
import AdjustmentDetailModal from './components/modals/adjustment_detail_modal.vue'
import CommentModal from './components/modals/CommentModal.vue'

const loading = ref(false)
const processing = ref(false)
const approvals = ref<CharityRequestApprove[]>([])
const filters = ref({ search: '', status: 'pending', action: '' })
const selectedRequest = ref<CharityRequestApprove | null>(null)
const toasts = ref<any[]>([])
const authStore = useAuthStore()

const actionModal = reactive({
  show: false,
  type: 'comment',
  reqId: null as number | null,
  text: ''
})

const isCharityAdmin = computed(() => ['admin', 'charity_admin'].includes(authStore.userRole || ''))

const viewDetail = (req: CharityRequestApprove) => {
  selectedRequest.value = req
}

const loadApprovals = async () => {
  loading.value = true
  const res = await CharityService.getRequests(filters.value)
  if (res.success) {
    approvals.value = res.data
  }
  loading.value = false
}

onMounted(loadApprovals)

const columns = [
  { key: 'requestId', label: 'ID', width: '60px' },
  { key: 'action', label: 'Action Type' },
  { key: 'requester', label: 'Requested By' },
  { key: 'status', label: 'Status', format: 'badge' }
]

const approvalStats = computed(() => [
  { key: 'pending', label: 'Pending Review', value: approvals.value.filter(a => a.status === 'pending').length, color: '#f59e0b' },
  { key: 'approved', label: 'Total Approved', value: approvals.value.filter(a => a.status === 'approved').length, color: '#10b981' },
  { key: 'rejected', label: 'Total Rejected', value: approvals.value.filter(a => a.status === 'rejected').length, color: '#ef4444' }
])

const filteredApprovals = computed(() => {
  let result = approvals.value
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(a => 
      a.action.toLowerCase().includes(q) || 
      a.requester?.fullName?.toLowerCase().includes(q)
    )
  }
  return result
})

const resetFilters = () => { 
  filters.value = { search: '', status: 'pending', action: '' }
  loadApprovals()
}

const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-ET', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const handleApprove = async (req: CharityRequestApprove) => {
  if (!confirm('Approve this request?')) return
  processing.value = true
  const res = await CharityService.approveRequest(req.requestId)
  if (res.success) {
    addToast('✅ Request approved successfully')
    loadApprovals()
  } else {
    addToast(res.error || 'Failed to approve', 'error')
  }
  processing.value = false
}

const openCommentModal = (req: CharityRequestApprove, type: 'comment' | 'reject') => {
  actionModal.type = type
  actionModal.reqId = req.requestId
  actionModal.text = ''
  actionModal.show = true
}

const handleActionSubmit = async (text: string) => {
  if (!actionModal.reqId || !text.trim()) return
  processing.value = true
  
  let res
  if (actionModal.type === 'reject') {
    res = await CharityService.rejectRequest(actionModal.reqId, text)
  } else {
    res = await CharityService.commentRequest(actionModal.reqId, text)
  }

  if (res.success) {
    addToast(`✅ Request ${actionModal.type === 'reject' ? 'rejected' : 'commented'}`)
    actionModal.show = false
    loadApprovals()
  } else {
    addToast(res.error || 'Operation failed', 'error')
  }
  processing.value = false
}

const addToast = (message: string, type: 'success' | 'error' = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => { toasts.value = toasts.value.filter(t => t.id !== id) }, 5000)
}
</script>

<style scoped>
.adjustments-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

.fb-select {
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 13px; color: #475569; background: white; outline: none;
}
.fb-select:focus { border-color: #6a11cb; }

.action-pill {
  padding: 4px 10px; border-radius: 6px; color: white;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
}
.action-pill.newbeneficiary { background: #3b82f6; }
.action-pill.newcharityteam { background: #8b5cf6; }
.action-pill.transferbeneficiary { background: #f59e0b; }
.action-pill.transfer { background: #f59e0b; }
.action-pill.deduct { background: #ef4444; }
.action-pill.increase { background: #10b981; }
.action-pill.return { background: #64748b; }

.requester-info { display: flex; flex-direction: column; }
.req-name { font-weight: 600; color: #1e293b; }
.req-date { font-size: 11px; color: #94a3b8; }

.table-actions { display: flex; gap: 8px; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.approve:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }
.action-btn.reject:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
.action-btn.comment:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

/* Toasts */
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); min-width: 250px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
</style>