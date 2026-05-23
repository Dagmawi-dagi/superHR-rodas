<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-box detail-modal">
      <div class="modal-header">
        <h3>Adjustment Request <span class="req-id">#{{ request?.requestId }}</span></h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div v-if="!request" class="loading-state">
        <div class="spinner"></div>
        Loading request details...
      </div>

      <template v-else>
        <div class="modal-body">
          <!-- Summary grid -->
          <div class="detail-grid">
            <div class="detail-item">
              <label>Action</label>
              <span class="action-pill" :class="request.action?.toLowerCase()">{{ request.action }}</span>
            </div>
            <div class="detail-item">
              <label>Status</label>
              <span :class="['status-badge', request.status]">{{ request.status?.toUpperCase() }}</span>
            </div>
            <div class="detail-item">
              <label>Requested By</label>
              <span>{{ request.requester?.fullName || `User #${request.requestedBy}` }}</span>
            </div>
            <div class="detail-item">
              <label>Submitted</label>
              <span>{{ formatDate(request.createdAt || request.created_at) }}</span>
            </div>
            <div class="detail-item" v-if="request.reviewedAt">
              <label>Reviewed</label>
              <span>{{ formatDate(request.reviewedAt) }}</span>
            </div>
            <div class="detail-item" v-if="request.approver || request.rejecter">
              <label>{{ request.status === 'approved' ? 'Approved By' : 'Rejected By' }}</label>
              <span>{{ (request.approver || request.rejecter)?.fullName }}</span>
            </div>
          </div>

          <!-- Metadata (what the adjustment is requesting) -->
          <div class="metadata-section" v-if="request.metadata && Object.keys(cleanMeta).length">
            <h4>Request Details</h4>
            <div class="metadata-box">
              <div v-for="(val, key) in cleanMeta" :key="key" class="meta-row">
                <span class="meta-key">{{ labelFor(key) }}:</span>
                <span class="meta-val">
                  <template v-if="key === 'amount'">
                    {{ template_type === 'money' ? formatCurrency(val) : val + ' units' }}
                  </template>
                  <template v-else>{{ val }}</template>
                </span>
              </div>
            </div>
          </div>

          <!-- Comment history -->
          <div class="comments-section">
            <h4>
              Comments
              <span v-if="request.comments?.length" class="comment-count">{{ request.comments.length }}</span>
            </h4>
            <div v-if="request.comments?.length" class="comments-list">
              <div v-for="(c, idx) in request.comments" :key="idx" class="comment-item">
                <div class="comment-meta">
                  <span class="comment-author">
                    {{ c.user_id === currentUserId ? 'You' : `User #${c.user_id}` }}
                  </span>
                  <span class="comment-date">{{ formatDate(c.created_at) }}</span>
                </div>
                <p>{{ c.text }}</p>
              </div>
            </div>
            <p v-else class="no-comments">No comments yet.</p>

            <!-- Add comment (admin only, request still open) -->
            <div v-if="canComment" class="add-comment-area">
              <textarea
                v-model="newComment"
                rows="3"
                placeholder="Add a comment or request clarification..."
                :disabled="submittingComment"
              ></textarea>
              <div class="comment-actions">
                <span class="comment-hint">Admin comment — stays visible to the requester</span>
                <button
                  class="btn-comment"
                  :disabled="!newComment.trim() || submittingComment"
                  @click="submitComment"
                >
                  {{ submittingComment ? 'Posting...' : 'Post Comment' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">Close</button>
          <!-- Admin: approve / reject while viewing -->
          <template v-if="isAdmin && ['pending', 'commented'].includes(request.status)">
            <button class="btn-danger" :disabled="submitting" @click="handleReject">
              {{ submitting === 'reject' ? 'Rejecting...' : 'Reject' }}
            </button>
            <button class="btn-approve" :disabled="submitting" @click="handleApprove">
              {{ submitting === 'approve' ? 'Approving...' : 'Approve' }}
            </button>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CharityService from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isOpen:        { type: Boolean, default: false },
  request:       { type: Object,  default: null  },
  template_type: { type: String,  default: 'money' } // 'money' | 'goods' | 'service'
})

const emit = defineEmits(['close', 'updated'])

const authStore       = useAuthStore()
const currentUserId   = computed(() => authStore.user?.userId)
const isAdmin         = computed(() => ['admin', 'charity_admin'].includes(authStore.userRole || ''))
const canComment      = computed(() =>
  isAdmin.value && props.request && ['pending', 'commented'].includes(props.request.status)
)

const newComment        = ref('')
const submittingComment = ref(false)
const submitting        = ref('')  // 'approve' | 'reject' | ''

// ── Clean metadata for display (skip internal ids that are already shown) ──────
const cleanMeta = computed(() => {
  if (!props.request?.metadata) return {}
  const skip = ['donation_item_id']  // already shown in header
  return Object.fromEntries(
    Object.entries(props.request.metadata).filter(([k]) => !skip.includes(k))
  )
})

const labelFor = (key) => {
  const map = {
    amount:               'Adjustment Value',
    reason:               'Reason',
    recurring_interval_id:'Period / Interval',
    toBeneficiaryId:      'Transfer To (ID)',
    from_team_id:         'From Team',
    charity_team_id:      'To Team',
    beneficiary_id:       'Beneficiary',
  }
  return map[key] || key.replace(/_/g, ' ')
}

// ── Actions ───────────────────────────────────────────────────────────────────

const submitComment = async () => {
  if (!newComment.value.trim() || !props.request) return
  submittingComment.value = true
  const res = await CharityService.commentRequest(props.request.requestId, newComment.value.trim())
  submittingComment.value = false
  if (res.success) {
    newComment.value = ''
    emit('updated', 'Comment posted')
  } else {
    alert(res.error || 'Failed to post comment')
  }
}

const handleApprove = async () => {
  if (!props.request) return
  submitting.value = 'approve'
  const res = await CharityService.approveRequest(props.request.requestId)
  submitting.value = ''
  if (res.success) emit('updated', 'Request approved')
  else alert(res.error || 'Failed to approve')
}

const handleReject = async () => {
  const reason = prompt('Reason for rejection (required):')
  if (!reason?.trim()) return
  submitting.value = 'reject'
  const res = await CharityService.rejectRequest(props.request.requestId, reason.trim())
  submitting.value = ''
  if (res.success) emit('updated', 'Request rejected')
  else alert(res.error || 'Failed to reject')
}

// ── Formatters ────────────────────────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v || 0)
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.6);
  backdrop-filter: blur(4px); display: flex; align-items: center;
  justify-content: center; z-index: 1200; padding: 20px;
}
.modal-box {
  background: white; border-radius: 20px; width: 100%; max-width: 600px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  display: flex; flex-direction: column; max-height: 92vh;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24px 28px 0; flex-shrink: 0;
}
.modal-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.req-id { color: #6a11cb; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.loading-state {
  padding: 60px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.spinner {
  width: 32px; height: 32px; border: 3px solid #e2e8f0;
  border-top-color: #6a11cb; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-body {
  padding: 24px 28px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 24px;
}

/* Summary grid */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
.detail-item span  { font-size: 14px; color: #1e293b; font-weight: 500; }

.action-pill {
  font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px;
  display: inline-block; width: fit-content; text-transform: capitalize;
}
.action-pill.deduct   { background: #fee2e2; color: #991b1b; }
.action-pill.increase { background: #dcfce7; color: #166534; }
.action-pill.transfer { background: #fef3c7; color: #b45309; }
.action-pill.return   { background: #e0f2fe; color: #0369a1; }

.status-badge {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px;
  display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;
}
.status-badge.pending   { background: #fffbeb; color: #d97706; }
.status-badge.approved  { background: #ecfdf5; color: #059669; }
.status-badge.rejected  { background: #fef2f2; color: #dc2626; }
.status-badge.commented { background: #f1f5f9; color: #475569; }

/* Metadata */
.metadata-section h4, .comments-section h4 {
  font-size: 13px; font-weight: 700; color: #334155;
  margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.5px;
}
.metadata-box { background: #f8fafc; padding: 14px 18px; border-radius: 12px; }
.meta-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
.meta-key { color: #64748b; text-transform: capitalize; }
.meta-val { font-weight: 600; color: #1e293b; }

/* Comments */
.comments-section { display: flex; flex-direction: column; gap: 8px; }
.comment-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; background: #ede9fe; color: #6a11cb;
  border-radius: 50%; font-size: 11px; font-weight: 700; margin-left: 6px;
}
.comments-list { display: flex; flex-direction: column; gap: 10px; }
.comment-item {
  padding: 12px 14px; background: #f8fafc; border-radius: 10px;
  border-left: 3px solid #6a11cb;
}
.comment-meta { display: flex; justify-content: space-between; margin-bottom: 4px; }
.comment-author { font-size: 12px; font-weight: 700; color: #1e293b; }
.comment-date   { font-size: 11px; color: #94a3b8; }
.comment-item p { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; }
.no-comments { font-size: 13px; color: #94a3b8; font-style: italic; margin: 0; }

/* Add comment */
.add-comment-area {
  margin-top: 12px; display: flex; flex-direction: column; gap: 8px;
  padding: 14px; background: #fdf8ff; border: 1px solid #ede9fe; border-radius: 12px;
}
.add-comment-area textarea {
  width: 100%; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 12px; font-size: 13px; resize: none; outline: none;
  box-sizing: border-box; transition: border-color 0.2s;
}
.add-comment-area textarea:focus { border-color: #6a11cb; }
.add-comment-area textarea:disabled { background: #f8fafc; color: #94a3b8; }
.comment-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.comment-hint { font-size: 11px; color: #94a3b8; }
.btn-comment {
  padding: 8px 20px; background: #6a11cb; color: white; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap;
}
.btn-comment:disabled { opacity: 0.5; cursor: not-allowed; }

/* Footer */
.modal-footer {
  padding: 16px 28px; border-top: 1px solid #f1f5f9; flex-shrink: 0;
  display: flex; justify-content: flex-end; gap: 10px;
}
.btn-secondary {
  background: #f1f5f9; color: #475569; border: none;
  padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-danger {
  background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2;
  padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-approve {
  background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none;
  padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
</style>