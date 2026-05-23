<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-box detail-modal">
      <div class="modal-header">
        <h3>Request Details #{{ request.requestId }}</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <label>Action</label>
            <span class="action-pill" :class="request.action.toLowerCase()">{{ request.action }}</span>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <span :class="['status-badge', request.status]">{{ request.status.toUpperCase() }}</span>
          </div>
          <div class="detail-item">
            <label>Requested By</label>
            <span>{{ request.requester?.fullName }}</span>
          </div>
          <div class="detail-item">
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

        <div class="comments-section" v-if="request.comments?.length">
          <h4>Comment History</h4>
          <div class="comments-list">
            <div v-for="(c, idx) in request.comments" :key="idx" class="comment-item">
              <div class="comment-meta">
                 <span>Admin #{{ c.user_id }}</span>
                 <span>{{ formatDate(c.created_at) }}</span>
              </div>
              <p>{{ c.text }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  request: { type: Object, default: null }
})
defineEmits(['close'])

const formatDate = (d) => {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px; }
.modal-box { background: white; border-radius: 20px; width: 100%; max-width: 600px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.modal-header h3 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-body { display: flex; flex-direction: column; gap: 24px; max-height: 70vh; overflow-y: auto; }
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
.metadata-section h4, .comments-section h4 { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 12px; }
.metadata-box { background: #f8fafc; padding: 16px; border-radius: 12px; }
.meta-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.meta-key { color: #64748b; }
.meta-val { font-weight: 600; color: #1e293b; }
.comments-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; border-left: 3px solid #6a11cb; }
.comment-meta { display: flex; justify-content: space-between; color: #94a3b8; font-size: 11px; margin-bottom: 4px; }
.modal-footer { margin-top: 24px; display: flex; justify-content: flex-end; }
.btn-secondary { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
</style>