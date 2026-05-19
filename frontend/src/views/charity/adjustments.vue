<template>
  <div class="adj-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Adjustment Requests</h1>
        <p class="page-subtitle">Review deduction, increase, reassignment and return requests</p>
      </div>
      <div class="header-right">
         <span class="count-badge" v-if="pendingCount">{{ pendingCount }} Pending</span>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon !p-3 pending">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">Pending Reviews</span>
          <span class="stat-value">{{ pendingCount }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon !p-3 approved">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-white"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="stat-content">
          <span class="stat-label">Total Handled</span>
          <span class="stat-value">{{ allData.length - pendingCount }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading && !allData.length" class="loading-state">
      <div class="spinner"></div>
      <p>Loading requests...</p>
    </div>

    <div v-else>
      <!-- Filter Bar -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" type="text" placeholder="Search by beneficiary or reason..." class="search-input" />
        </div>
        <div class="tab-group">
          <button
            v-for="tab in tabs" :key="tab.value"
            class="tab-btn" :class="{ active: activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <AdjustmentTable
        :adjustments="filteredAdjustments"
        :can-review="true"
        @view="openViewDetail"
        @review="openReview"
      />
    </div>

    <!-- Review Modal (standard) -->
    <div v-if="reviewModal.open" class="modal-overlay">
      <div class="modal-box">
        <h3 class="modal-title">
          {{ reviewModal.action === 'approved' ? '✓ Approve' : '✗ Reject' }} Adjustment
        </h3>
        <p class="modal-subtitle">
          {{ reviewModal.action === 'approved' ? 'This will immediately apply the change.' : 'The team leader will be notified.' }}
        </p>

        <template v-if="!reviewModal.confirming">
          <div class="modal-detail">
            <div class="modal-detail-row">
              <span>Item ID</span><strong>#{{ reviewModal.adjustment?.donationItemId }}</strong>
            </div>
            <div class="modal-detail-row" v-if="reviewModal.adjustment?.intervalId">
              <span>Interval ID</span><strong>#{{ reviewModal.adjustment?.intervalId }}</strong>
            </div>
            <div class="modal-detail-row">
              <span>Type</span><strong>{{ charityService.getAdjustmentTypeLabel(reviewModal.adjustment?.type) }}</strong>
            </div>
            <div class="modal-detail-row">
              <span>Beneficiary</span><strong>{{ reviewModal.adjustment?.beneficiary?.name }}</strong>
            </div>
            <div class="modal-detail-row">
              <span>Value / Qty</span>
              <strong>
                {{ reviewModal.adjustment?.itemType === 'money' 
                   ? charityService.formatCurrency(reviewModal.adjustment?.value) 
                   : reviewModal.adjustment?.quantity }}
                <span v-if="reviewModal.adjustment?.itemType !== 'money'" style="font-size: 11px; font-weight: normal; margin-left: 4px;">units</span>
              </strong>
            </div>
          </div>

          <div class="form-field">
            <label>Comment <span v-if="reviewModal.action === 'rejected'" class="req">*</span></label>
            <textarea
              v-model="reviewModal.comment"
              rows="3"
              :placeholder="reviewModal.action === 'approved' ? 'Optional comment...' : 'Explain why...'"
            ></textarea>
            <span v-if="reviewModal.error" class="error-text">{{ reviewModal.error }}</span>
          </div>
        </template>

        <!-- Confirmation View -->
        <div v-else class="confirm-view">
          <div class="confirm-banner" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px; background: #fdfaff; border: 1px solid #ede9fe; border-radius: 12px;">
             <span style="font-size: 24px;">❓</span>
             <h4 style="margin: 0; color: #6d28d9; font-size: 16px; font-weight: 600;">
               Are you sure you want to {{ reviewModal.action }} this request?
             </h4>
          </div>
          
          <div class="confirm-summary" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: #64748b;">Action:</span>
              <strong :style="{ color: reviewModal.action === 'approved' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }">
                {{ reviewModal.action }}
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: #64748b;">Type:</span>
              <strong style="color: #1e293b;">{{ charityService.getAdjustmentTypeLabel(reviewModal.adjustment?.type) }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: #64748b;">Beneficiary:</span>
              <strong style="color: #1e293b;">{{ reviewModal.adjustment?.beneficiary?.name }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
              <span style="color: #64748b;">{{ reviewModal.adjustment?.itemType === 'money' ? 'Value' : 'Quantity' }}:</span>
              <strong style="color: #7c3aed;">
                {{ reviewModal.adjustment?.itemType === 'money' ? charityService.formatCurrency(reviewModal.adjustment?.value) : reviewModal.adjustment?.quantity + ' units' }}
              </strong>
            </div>
            <div style="border-top: 1px solid #f1f5f9; margin-top: 4px; padding-top: 12px;">
              <span style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Admin Comment:</span>
              <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #f1f5f9;">
                {{ reviewModal.comment || '(No comment provided)' }}
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="reviewModal.confirming ? (reviewModal.confirming = false) : closeReview()">
            {{ reviewModal.confirming ? 'Back' : 'Cancel' }}
          </button>
          <button
            :class="reviewModal.action === 'approved' ? 'btn-approve' : 'btn-reject'"
            :disabled="reviewModal.submitting"
            @click="submitReview"
          >
            {{ reviewModal.submitting ? 'Processing...' : reviewModal.confirming ? 'Yes, Proceed' : 'Next' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import charityService, { type AdjustmentRequest } from '@/stores/charity'
import AdjustmentTable from './components/Donation/AdjustmentTable.vue'

const loading     = ref(false)
const allData     = ref<AdjustmentRequest[]>([])
const activeTab   = ref('pending')
const search      = ref('')

const tabs = [
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All',      value: 'all' },
]

const pendingCount = computed(() => allData.value.filter(a => a.status === 'pending').length)

const filteredAdjustments = computed(() => {
  let list = activeTab.value === 'all' ? allData.value : allData.value.filter(a => a.status === activeTab.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(a => 
      a.beneficiary?.name?.toLowerCase().includes(q) || 
      a.reason?.toLowerCase().includes(q) ||
      a.toBeneficiary?.name?.toLowerCase().includes(q)
    )
  }
  return list
})

const reviewModal = ref({ 
  open: false, 
  adjustment: null as AdjustmentRequest | null, 
  action: 'approved' as any, 
  comment: '', 
  error: '', 
  submitting: false,
  confirming: false // NEW
})

const loadAdjustments = async () => {
  loading.value = true
  const res = await charityService.getAllPendingAdjustments()
  if (res.success) allData.value = res.data
  loading.value = false
}

const openReview = (adj: AdjustmentRequest, action: 'approved' | 'rejected') => {
  reviewModal.value = { open: true, adjustment: adj, action, comment: '', error: '', submitting: false, confirming: false }
}
const closeReview = () => { reviewModal.value.open = false; reviewModal.value.confirming = false; }

const submitReview = async () => {
  if (reviewModal.value.action === 'rejected' && !reviewModal.value.comment.trim()) {
    reviewModal.value.error = 'Please provide a reason for rejection'; return
  }
  
  if (!reviewModal.value.confirming) {
    reviewModal.value.confirming = true
    return
  }

  reviewModal.value.submitting = true
  reviewModal.value.error = ''
  const res = await charityService.reviewAdjustment(reviewModal.value.adjustment!.adjustmentId, reviewModal.value.action, reviewModal.value.comment || undefined)
  reviewModal.value.submitting = false
  if (res.success) { closeReview(); await loadAdjustments() }
  else {
    reviewModal.value.error = res.error || 'Failed to process'
    reviewModal.value.confirming = false // allow retry
  }
}

const openViewDetail = (adj: AdjustmentRequest) => {
  // Can redirect to donation item or just show expanded info
}

onMounted(loadAdjustments)
</script>

<style scoped>
.adj-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
.count-badge { background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 600; padding: 4px 14px; border-radius: 20px; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; border-radius: 16px; padding: 18px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.stat-icon.pending { background: #f59e0b; }
.stat-icon.approved { background: #10b981; }
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 12px; color: #64748b; }
.stat-value { font-size: 22px; font-weight: 700; color: #1e293b; }

.filters-bar { background: white; padding: 16px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.search-wrapper { position: relative; flex: 1; max-width: 400px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #6a11cb; }

.tab-group { display: flex; gap: 8px; }
.tab-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
.tab-btn.active { background: #6a11cb; color: white; border-color: #6a11cb; }

.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: white; border-radius: 14px; padding: 24px; width: 100%; max-width: 480px; }
.modal-title { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.modal-subtitle { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
.modal-detail { background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
.modal-detail-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
.form-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 6px; }
.form-field textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; resize: vertical; box-sizing: border-box; }
.req { color: #ef4444; }
.error-text { font-size: 12px; color: #ef4444; margin-top: 4px; display: block; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 8px 18px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; }
.btn-approve { padding: 8px 20px; background: #22c55e; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-reject  { padding: 8px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
</style>
