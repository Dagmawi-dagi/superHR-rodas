<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-box detail-modal">
      <div class="modal-header">
        <div class="header-left">
          <h3>Request Details #{{ request.requestId }}</h3>
        </div>
        <div class="header-right">
          <span :class="['status-badge', request.status]">{{ request.status.toUpperCase() }}</span>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
      </div>
      
      <div class="modal-body">
        <!-- ── EDIT MODE ── -->
        <template v-if="isEditing">
          <div class="edit-form">
            <div class="form-group">
              <label>Adjustment Type <span class="req">*</span></label>
              <div class="type-grid">
                <button
                  v-for="t in types" :key="t.id"
                  type="button"
                  class="type-btn"
                  :class="[{ active: editableData.action === t.id }, t.cls]"
                  @click="editableData.action = t.id"
                >
                  {{ t.label }}
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ itemType === 'money' ? 'Value (ETB)' : 'Quantity' }} <span class="req">*</span></label>
                <input
                  v-model.number="editableData.amount"
                  type="number" step="0.01" min="0.01"
                  required
                  :placeholder="itemType === 'money' ? '0.00' : '0'"
                />
              </div>

              <div class="form-group" v-if="editableData.action === 'Transfer'">
                <label>Transfer To (ID) <span class="req">*</span></label>
                <input v-model.number="editableData.toBeneficiaryId" type="number" placeholder="Beneficiary ID" required />
                <small class="hint">Enter target beneficiary ID</small>
              </div>
            </div>

            <div class="form-group">
              <label>Reason for Request <span class="req">*</span></label>
              <textarea
                v-model="editableData.reason"
                rows="3" required
                placeholder="Explain why this adjustment is needed..."
              ></textarea>
            </div>
          </div>
        </template>

        <!-- ── VIEW MODE ── -->
        <template v-else>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Action</label>
              <span class="action-pill" :class="request.action.toLowerCase()">{{ request.action }}</span>
            </div>
            <div class="detail-item">
              <label>Requested By</label>
              <span>{{ request.requester?.fullName }}</span>
            </div>
            <div class="detail-item full">
              <label>Date</label>
              <span>{{ formatDate(request.created_at) }}</span>
            </div>
          </div>

          <div class="metadata-section" v-if="request.metadata">
            <h4>Request Information</h4>
            <div class="metadata-box">
              <div v-for="(val, key) in request.metadata" :key="key" class="meta-row">
                <span class="meta-key">{{ 
                  key.replace(/_/g, ' ')
                     .replace('recurring id', 'Period ID')
                     .replace('donation item id', 'Item ID')
                     .replace('toBeneficiaryId', 'To Beneficiary ID')
                     .replace('amount', 'Adjustment Value')
                }}:</span>
                <span class="meta-val">{{ val }}</span>
              </div>
            </div>
          </div>
        </template>

        <div class="comments-section">
          <h4>Comment History</h4>
          <div class="comments-list" v-if="request.comments?.length">
            <div v-for="(c, idx) in request.comments" :key="idx" class="comment-item">
              <div class="comment-meta">
                 <span>Admin #{{ c.user_id }}</span>
                 <span>{{ formatDate(c.created_at) }}</span>
              </div>
              <p>{{ c.text }}</p>
            </div>
          </div>
          <div v-else class="empty-comments">No comments yet.</div>

          <div class="add-comment-area" v-if="isCharityAdmin && (request.status === 'pending' || request.status === 'commented')">
            <label>Add Feedback / Reason</label>
            <textarea 
              v-model="newComment" 
              placeholder="Enter your comment or rejection reason here..." 
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <!-- Admin Actions -->
        <div class="admin-actions" v-if="isCharityAdmin && (request.status === 'pending' || request.status === 'commented')">
          <button class="btn-outline" @click="handleAction('comment')" :disabled="!newComment.trim() || processing">Comment</button>
          <button class="btn-primary success" @click="handleAction('approve')" :disabled="processing">Approve</button>
          <button class="btn-outline danger" @click="handleAction('reject')" :disabled="!newComment.trim() || processing">Reject</button>
        </div>
        
        <!-- Team Leader Actions -->
        <div class="user-actions" v-else-if="request.status === 'commented' && isOwner">
          <button v-if="!isEditing" class="btn-outline" @click="startEditing">Edit Adjustment</button>
          <button v-if="isEditing" class="btn-secondary" @click="isEditing = false">Back</button>
          <button class="btn-primary" @click="handleResubmit" :disabled="processing || (isEditing && !isValid)">
            {{ isEditing ? 'Save & Resubmit' : 'Resubmit for Approval' }}
          </button>
        </div>
        
        <button v-else class="btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  request: { type: Object, default: null },
  processing: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'approve', 'reject', 'comment', 'resubmit'])
const authStore = useAuthStore()
const newComment = ref('')

const isEditing = ref(false)
const editableData = reactive({
  action: '',
  amount: null,
  reason: '',
  toBeneficiaryId: null
})

const isCharityAdmin = computed(() => ['admin', 'charity_admin'].includes(authStore.userRole || ''))
const isOwner = computed(() => authStore.user?.userId === props.request?.requestedBy)
const itemType = computed(() => props.request?.metadata?.type || 'money')

const types = [
  { id: 'Deduct',   label: 'Deduct',   cls: 'deduct'   },
  { id: 'Increase', label: 'Increase', cls: 'increase' },
  { id: 'Transfer', label: 'Transfer', cls: 'transfer' },
  { id: 'Return',   label: 'Return',   cls: 'return'   },
]

const isValid = computed(() => {
  if (!editableData.action || !editableData.reason?.trim()) return false
  if (editableData.amount === null || editableData.amount <= 0) return false
  if (editableData.action === 'Transfer' && !editableData.toBeneficiaryId) return false
  return true
})

const startEditing = () => {
  editableData.action = props.request.action
  editableData.amount = parseFloat(props.request.metadata?.amount || 0)
  editableData.reason = props.request.metadata?.reason || ''
  editableData.toBeneficiaryId = props.request.metadata?.toBeneficiaryId || null
  isEditing.value = true
}

const handleAction = (type) => {
  if (type === 'approve') {
    emit('approve', props.request)
  } else if (type === 'reject') {
    emit('reject', props.request, newComment.value)
    newComment.value = ''
  } else if (type === 'comment') {
    emit('comment', props.request, newComment.value)
    newComment.value = ''
  }
}

const handleResubmit = () => {
  if (isEditing.value) {
    if (!isValid.value) return
    emit('resubmit', props.request, {
      action: editableData.action,
      reason: editableData.reason,
      metadata: {
        amount: editableData.amount,
        toBeneficiaryId: editableData.toBeneficiaryId
      }
    })
  } else {
    emit('resubmit', props.request)
  }
}

const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-ET', { 
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// Reset editing state when modal closes
watch(() => props.isOpen, (val) => {
  if (!val) isEditing.value = false
})
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px; }
.modal-box { background: white; border-radius: 20px; width: 100%; max-width: 650px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-left h3 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
.header-right { display: flex; align-items: center; gap: 16px; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; line-height: 1; padding: 0; }
.modal-body { display: flex; flex-direction: column; gap: 24px; max-height: 65vh; overflow-y: auto; padding-right: 8px; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

.action-pill { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; display: inline-block; width: fit-content; text-transform: capitalize; }
.action-pill.deduct { background: #fee2e2; color: #991b1b; }
.action-pill.increase { background: #dcfce7; color: #166534; }
.action-pill.transfer { background: #fef3c7; color: #b45309; }
.action-pill.return { background: #e0f2fe; color: #0369a1; }

.status-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; display: inline-block; }
.status-badge.pending { background: #fffbeb; color: #d97706; }
.status-badge.approved { background: #ecfdf5; color: #059669; }
.status-badge.rejected { background: #fef2f2; color: #dc2626; }
.status-badge.commented { background: #f1f5f9; color: #475569; }

/* Edit Form */
.edit-form { display: flex; flex-direction: column; gap: 20px; padding: 16px; background: #fdfaff; border: 1px solid #ede9fe; border-radius: 16px; }
.type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
.type-btn { padding: 8px 4px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; font-weight: 600; background: white; color: #64748b; cursor: pointer; transition: all 0.2s; }
.type-btn.active.deduct   { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
.type-btn.active.increase { background: #dcfce7; border-color: #22c55e; color: #15803d; }
.type-btn.active.transfer { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
.type-btn.active.return   { background: #e0f2fe; border-color: #0ea5e9; color: #0369a1; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }
.hint { font-size: 11px; color: #94a3b8; }
input, textarea { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; outline: none; }
input:focus, textarea:focus { border-color: #6a11cb; }

.metadata-section h4, .comments-section h4 { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 12px; margin-top: 24px; }
.metadata-box { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; }
.meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.meta-key { color: #64748b; }
.meta-val { font-weight: 600; color: #1e293b; }

.comments-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.comment-item { padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; border-left: 3px solid #6a11cb; }
.comment-meta { display: flex; justify-content: space-between; color: #94a3b8; font-size: 11px; margin-bottom: 4px; }
.empty-comments { font-size: 13px; color: #94a3b8; font-style: italic; margin-bottom: 20px; }

.add-comment-area { display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }
.add-comment-area label { font-size: 12px; font-weight: 700; color: #475569; }
.add-comment-area textarea { width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; outline: none; resize: none; }
.add-comment-area textarea:focus { border-color: #6a11cb; }

.modal-footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; }
.admin-actions, .user-actions { display: flex; gap: 12px; }
.btn-outline { padding: 10px 20px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; cursor: pointer; }
.btn-outline.danger { border-color: #ef4444; color: #ef4444; }
.btn-outline.danger:hover { background: #fef2f2; }
.btn-primary { padding: 10px 24px; border-radius: 10px; background: #6a11cb; color: white; border: none; font-weight: 600; cursor: pointer; }
.btn-primary.success { background: #10b981; }
.btn-primary:disabled, .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
</style>
