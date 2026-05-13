<template>
  <div class="pending-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Pending Approvals</h1>
        <p class="page-subtitle">Donations waiting for your review</p>
      </div>
      <div class="header-right">
        <span class="count-badge">{{ donations.length }} pending</span>
      </div>
    </div>

    <!-- Stats Cards (Reuse standard DonationStatsCards but with pending-focused data) -->
    <DonationStatsCards :stats="stats" />

    <div v-if="loading && !donations.length" class="loading-state">
      <div class="spinner"></div>
      <p>Loading pending donations...</p>
    </div>

    <div v-else>
      <!-- Filters (Search only usually enough for pending, but can add more) -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" type="text" placeholder="Search pending donations..." class="search-input" />
        </div>
      </div>

      <DonationTable
        :donations="filteredDonations"
        :pagination="{ totalItems: filteredDonations.length, totalPages: 1, currentPage: 1, pageSize: 100 }"
        :can-approve="true"
        @view-donation="viewDonation"
        @approve-donation="openApprove"
        @cancel-donation="confirmCancel"
      />
    </div>

    <!-- Approve Modal -->
    <div v-if="approveModal.open" class="modal-overlay" @click.self="approveModal.open = false">
      <div class="modal-box">
        <h3 class="modal-title">Approve Donation</h3>
        <p class="modal-sub">{{ approveModal.donation?.DonationCompany?.name }} — {{ charityService.formatCurrency(approveModal.donation?.totalValue) }}</p>
        <div class="form-field">
          <label>Comment (optional)</label>
          <textarea v-model="approveModal.comment" rows="3" placeholder="Any notes for the team leader..."></textarea>
        </div>
        <div class="action-choice">
          <button class="btn-approve" :disabled="approveModal.submitting" @click="submitApprove">
            ✓ Approve
          </button>
          <button class="btn-reject" :disabled="approveModal.submitting" @click="openRejectFromApprove">
            ✗ Request Changes
          </button>
        </div>
        <div v-if="approveModal.error" class="error-banner">{{ approveModal.error }}</div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="approveModal.open = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Request Changes Modal -->
    <div v-if="rejectModal.open" class="modal-overlay" @click.self="rejectModal.open = false">
      <div class="modal-box">
        <h3 class="modal-title">Request Changes</h3>
        <p class="modal-sub">{{ rejectModal.donation?.DonationCompany?.name }}</p>
        <div class="form-field">
          <label>What needs to be changed? <span class="req">*</span></label>
          <textarea v-model="rejectModal.comment" rows="4" placeholder="Describe what the team leader needs to fix..."></textarea>
          <span v-if="rejectModal.error" class="error-text">{{ rejectModal.error }}</span>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="rejectModal.open = false">Back</button>
          <button class="btn-reject" :disabled="rejectModal.submitting" @click="submitReject">
            {{ rejectModal.submitting ? 'Sending...' : 'Send Back for Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import charityService, { type Donation } from '@/stores/charity'
import DonationTable from './components/Donation/DonationTable.vue'
import DonationStatsCards from './components/Donation/DonationStatsCards.vue'

const router   = useRouter()
const loading  = ref(false)
const donations = ref<Donation[]>([])
const search   = ref('')

const filteredDonations = computed(() => {
  if (!search.value.trim()) return donations.value
  const q = search.value.toLowerCase()
  return donations.value.filter(d => 
    d.DonationCompany?.name?.toLowerCase().includes(q) || 
    d.Campaign?.title?.toLowerCase().includes(q) ||
    String(d.donationId).includes(q)
  )
})

const stats = computed(() => ({
  totalDonations: donations.value.length,
  totalValue: donations.value.reduce((sum, d) => sum + (d.totalValue || 0), 0),
  statusBreakdown: { pending: donations.value.length },
  returnedValue: 0
}))

const approveModal = ref({ open: false, donation: null as Donation | null, comment: '', error: '', submitting: false })
const rejectModal  = ref({ open: false, donation: null as Donation | null, comment: '', error: '', submitting: false })

const load = async () => {
  loading.value = true
  const res = await charityService.getDonations({ status: 'pending', limit: 100 })
  if (res.success) donations.value = res.data
  loading.value = false
}

const viewDonation = (don: Donation) => router.push(`/charity/donations/${don.donationId}`)
const openApprove = (don: Donation) => {
  approveModal.value = { open: true, donation: don, comment: '', error: '', submitting: false }
}
const openRejectFromApprove = () => {
  const don = approveModal.value.donation
  approveModal.value.open = false
  rejectModal.value = { open: true, donation: don, comment: '', error: '', submitting: false }
}

const submitApprove = async () => {
  approveModal.value.submitting = true
  approveModal.value.error = ''
  const res = await charityService.approveDonation(approveModal.value.donation!.donationId, approveModal.value.comment)
  approveModal.value.submitting = false
  if (res.success) { approveModal.value.open = false; await load() }
  else approveModal.value.error = res.error || 'Failed to approve'
}

const submitReject = async () => {
  if (!rejectModal.value.comment.trim()) { rejectModal.value.error = 'Please describe what needs to change'; return }
  rejectModal.value.submitting = true
  const res = await charityService.requestChanges(rejectModal.value.donation!.donationId, rejectModal.value.comment)
  rejectModal.value.submitting = false
  if (res.success) { rejectModal.value.open = false; await load() }
  else rejectModal.value.error = res.error || 'Failed to send'
}

const confirmCancel = async (don: Donation) => {
  if (!confirm(`Cancel donation #${don.donationId}?`)) return
  const res = await charityService.cancelDonation(don.donationId)
  if (res.success) await load()
  else alert(res.error || 'Failed to cancel')
}

onMounted(load)
</script>

<style scoped>
.pending-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }
.count-badge { background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 600; padding: 4px 14px; border-radius: 20px; }

.filters-bar { background: white; padding: 16px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.search-wrapper { position: relative; max-width: 400px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #6a11cb; }

.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modals (standard) */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: white; border-radius: 14px; padding: 24px; width: 100%; max-width: 480px; }
.modal-title { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.modal-sub   { font-size: 13px; color: #6b7280; margin: 0 0 18px; }
.form-field  { margin-bottom: 14px; }
.form-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 5px; }
.form-field textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; resize: vertical; box-sizing: border-box; }
.req { color: #ef4444; }
.error-text  { font-size: 12px; color: #ef4444; margin-top: 3px; display: block; }
.error-banner { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }

.action-choice { display: flex; gap: 12px; margin-bottom: 20px; }
.btn-approve { flex: 1; padding: 10px; background: #22c55e; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-reject  { flex: 1; padding: 10px; background: #f59e0b; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 8px 18px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; }
</style>
