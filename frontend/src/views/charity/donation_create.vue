<template>
  <div class="donation-create">
    <!-- Back header -->
    <div class="create-header">
      <div class="header-main">
        <router-link to="/charity/donations" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
        </router-link>
        <div class="header-title">
          <h1>{{ isView ? 'View Donation' : isEdit ? 'Edit Donation' : 'New Donation' }}</h1>
          <p>{{ isView ? 'Detailed breakdown' : 'Allocate donation items to beneficiaries within a team' }}</p>
        </div>
      </div>
      <div v-if="donationId" class="header-status">
        <span :class="['status-pill', donationStatus]">{{ donationStatus.toUpperCase() }}</span>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="donation-form">
      
      <!-- ═══════════════ STEP 1: DONATION INFO ═══════════════ -->
      <div class="form-card">
        <div class="card-header collapsible-header" @click="isInfoExpanded = !isInfoExpanded">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4m16 5H4m16 5H4"/></svg>
            <h3>Donation Information</h3>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: isInfoExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="isInfoExpanded" class="card-body">
            <div class="form-row">
              <div class="form-field">
                <label>Charity Team <span class="req">*</span></label>
                <select v-model="form.teamId" @change="handleTeamChange" :disabled="isEdit || isView">
                  <option value="">Select team</option>
                  <option v-for="t in teams" :key="t.teamId" :value="t.teamId">{{ t.name }}</option>
                </select>
                <span class="error" v-if="errors.teamId">{{ errors.teamId }}</span>
              </div>
              <div class="form-field">
                <label>Delivery Date <span class="req">*</span></label>
                <input type="date" v-model="form.donationDeliveryDate" :disabled="isView" />
                <span class="error" v-if="errors.donationDeliveryDate">{{ errors.donationDeliveryDate }}</span>
              </div>
            </div>
            <div class="form-field full">
              <label>Donation Description</label>
              <textarea v-model="form.description" rows="2" placeholder="e.g. Winter Clothing Drive 2024" :disabled="isView"></textarea>
            </div>
          </div>
        </transition>
      </div>

      <!-- ═══════════════ Donation Comments ═══════════════ -->
      <div class="form-card" v-if="donationComments.length > 0">
        <div class="card-header collapsible-header" @click="isCommentsExpanded = !isCommentsExpanded">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <h3>History & Comments</h3>
            <span class="comment-count-badge">{{ donationComments.length }}</span>
          </div>
          <div class="header-right">
             <svg class="collapse-chevron" :class="{ rotated: isCommentsExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div class="card-body" v-show="isCommentsExpanded">
            <div class="comments-list">
              <div v-for="(c, idx) in donationComments" :key="idx" class="comment-item">
                <div class="comment-meta">
                  <span class="comment-author">Admin #{{ c.user_id || c.commentedBy }}</span>
                  <span class="comment-date">{{ formatDate(c.created_at || c.commentedAt) }}</span>
                </div>
                <p class="comment-text">{{ c.text }}</p>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- ═══════════════ STEP 2: ITEM TEMPLATE ═══════════════ -->
      <div class="form-card" v-if="form.teamId">
        <div class="card-header collapsible-header" @click="isTemplateExpanded = !isTemplateExpanded">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <h3>Item Template</h3>
            <small class="header-hint">Define what is being distributed to all selected beneficiaries</small>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: isTemplateExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        <transition name="collapse">
          <div v-show="isTemplateExpanded" class="card-body">
            <div class="form-row">
              <div class="form-field">
                <label>Item Type <span class="req">*</span></label>
                <select v-model="template.type" :disabled="isView">
                  <option value="money">Money</option>
                  <option value="goods">Goods</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div class="form-field">
                <label>Item Description <span class="req">*</span></label>
                <input type="text" v-model="template.description" placeholder="e.g. Monthly Allowance, 50kg Rice" :disabled="isView" />
              </div>
            </div>
            <div class="form-row" v-if="template.type !== 'money'">
              <div class="form-field">
                <label>Unit Value (ETB) <span class="req">*</span></label>
                <input type="number" step="0.01" v-model.number="template.unitValueInBirr" placeholder="0.00" :disabled="isView" />
              </div>
              <div class="form-field"></div>
            </div>
            
            <div class="recurring-toggle">
              <label class="toggle-container">
                <input type="checkbox" v-model="template.isRecurring" :disabled="isView" />
                <span class="toggle-label">Is this a recurring distribution?</span>
              </label>
            </div>
          </div>
        </transition>
      </div>

      <!-- ═══════════════ STEP 3: BENEFICIARY ALLOCATION ═══════════════ -->
      <div class="form-card" v-if="form.teamId">
        <div class="card-header collapsible-header" @click="isAllocationExpanded = !isAllocationExpanded">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <h3>Beneficiary Allocation</h3>
            <div class="header-badges">
              <span class="count-badge">{{ teamBeneficiaries.length }} beneficiaries</span>
              <span v-if="pendingAdjustmentCount > 0" class="adj-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ pendingAdjustmentCount }} active adjs
              </span>
              <span v-if="returnedCount > 0" class="returned-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                {{ returnedCount }} returned
              </span>
            </div>
          </div>
          <div class="header-right">
            <svg class="collapse-chevron" :class="{ rotated: isAllocationExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>
        
        <transition name="collapse">
          <div v-show="isAllocationExpanded" class="card-body">
            <!-- ── BULK SETTINGS BAR ── --> 
            <div v-if="!isView" class="flex mw-100px gap-2 mb-3! text-base font-bold text-slate-700 text-xs" >
              <span style="width: 16px;">
                 <svg viewBox="0 0 24 24" fill="none" stroke="#6a11cb" stroke-width="2" class="icon-sm"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </span>
              Bulk Fill All:
            </div>

            <div v-if="!isView" class="bulk-settings-bar">
              <div class="bulk-inputs">
                <div class="bulk-field">
                  <input type="number" v-model.number="bulk.value" :placeholder="template.type === 'money' ? 'Amount (ETB)' : 'Quantity'" />
                </div>
                <div class="bulk-field" v-if="template.type === 'money'">
                  <select v-model="bulk.paymentMethod">
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <template v-if="template.isRecurring">
                  <div class="bulk-field">
                    <select v-model="bulk.recurringType">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div class="bulk-field">
                    <input type="number" v-model.number="bulk.recurringCount" placeholder="Count" min="0" />
                  </div>
                </template>
                <button type="button" class="btn-bulk-apply" @click="applyBulkSettings">Apply to All</button>
              </div>
              <div class="list-search">
                <input type="text" v-model="allocationSearch" placeholder="Search in list..." />
              </div>
            </div>

            <div v-if="loadingBens" class="loading-bens">
              <div class="mini-spinner"></div>
              Loading team beneficiaries...
            </div>
            <template v-else>
              <div class="ben-table">
                <div class="ben-header" :class="{ 'recurring-grid': template.isRecurring }">
                  <span class="col-name">Beneficiary</span>
                  <template v-if="template.isRecurring">
                    <span class="col-int">Recurring Type</span>
                    <span class="col-count">Count</span>
                  </template>
                  <template v-else>
                    <span class="col-input">{{ template.type === 'money' ? 'Amount (ETB)' : 'Quantity' }}</span>
                    <span class="col-method" v-if="template.type === 'money'">Method</span>
                    <span class="col-total" v-if="template.type !== 'money'">Total Value</span>
                    <span class="col-adj" v-if="isView && donationStatus === 'approved'">
                      Action
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon"><path d="M12 20v-6M9 17l3 3 3-3M12 4v6M9 7l3-3 3 3"/></svg>
                    </span>
                  </template>
                </div>

                <div v-for="row in filteredRows" :key="row.beneficiaryId" class="ben-row-wrapper">
                  <div class="ben-row" :class="{ 'active': rowHasValue(row), 'recurring-grid': template.isRecurring, 'under-adj': isUnderAdjustment(row), 'is-returned': !template.isRecurring && row.is_returned }" @click="(!template.isRecurring && isUnderAdjustment(row)) ? viewAdjustmentDetail(row) : null">
                    <div class="col-name">
                      <button 
                        v-if="template.isRecurring && row.recurringCount > 0"
                        type="button"
                        class="collapse-btn"
                        :class="{ 'is-open': row.isExpanded }"
                        @click.stop="row.isExpanded = !row.isExpanded"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                      <div class="ben-avatar">{{ row.name[0] }}</div>
                      <span class="ben-name text-truncate">{{ row.name }}</span>
                    </div>

                    <template v-if="template.isRecurring">
                      <div class="col-int">
                        <select v-model="row.recurringType" @change="syncRecurrings(row)" :disabled="isView" @click.stop>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div class="col-count">
                        <input type="number" v-model.number="row.recurringCount" min="0" placeholder="0" @input="syncRecurrings(row)" :disabled="isView" @click.stop />
                      </div>
                    </template>

                    <template v-else>
                      <div class="col-input">
                        <input type="number" v-model.number="row.value" step="0.01" min="0" :placeholder="template.type === 'money' ? '0.00' : '0'" :disabled="isView" @click.stop />
                      </div>
                      <div class="col-method" v-if="template.type === 'money'">
                        <select v-model="row.paymentMethod" :disabled="isView" @click.stop>
                          <option value="bank">Bank</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div class="col-total" v-if="template.type !== 'money'">
                        <span class="computed-val">{{ formatCurrency(rowValue(row)) }}</span>
                      </div>
                      <div class="col-adj" v-if="isView && donationStatus === 'approved'">
                        <button type="button" class="btn-adj" :class="{ 'is-returned': row.is_returned }" :title="row.is_returned ? 'Reassign' : 'Adjust'" @click.stop="row.is_returned ? openReassign(row) : openAdjustment(row)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M9 17l3 3 3-3M12 4v6M9 7l3-3 3 3"/></svg>
                        </button>
                      </div>
                    </template>
                  </div>
                  
                  <div class="recurring-details" v-if="template.isRecurring && row.recurringCount > 0 && row.isExpanded">
                    <div class="details-header" :class="{ 'goods-header': template.type !== 'money', 'has-adj': isView && donationStatus === 'approved' }">
                      <span>Period ID</span>
                      <span>{{ template.type === 'money' ? 'Value (ETB)' : 'Quantity' }}</span>
                      <span v-if="template.type === 'money'">Method</span>
                      <span v-if="template.type !== 'money'">Subtotal</span>
                      <span v-if="isView && donationStatus === 'approved'">Action</span>
                    </div>
                    <div v-for="(rec, idx) in row.recurrings" :key="idx" class="details-row" :class="{ 'goods-row': template.type !== 'money', 'has-adj': isView && donationStatus === 'approved', 'under-adj': isUnderAdjustment(row, rec.recurring_id), 'is-returned': rec.is_returned }" @click="isUnderAdjustment(row, rec.recurring_id) ? viewAdjustmentDetail(row, rec.recurring_id) : null">
                      <div class="period-cell">
                        <small class="period-label">{{ row.recurringType.charAt(0).toUpperCase() + row.recurringType.slice(1) }}#{{ idx + 1 }}</small>
                      </div>
                      <div class="val-input-wrap">
                        <input v-if="template.type === 'money'" type="number" step="0.01" v-model.number="rec.total_value_in_birr" class="mini-input" :disabled="isView" @click.stop />
                        <input v-else type="number" v-model.number="rec.quantity" class="mini-input" :disabled="isView" @click.stop />
                      </div>
                      <div v-if="template.type === 'money'" class="method-box">
                        <select v-model="rec.paymentMethod" class="mini-select" :disabled="isView" @click.stop>
                          <option value="bank">Bank</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>
                      <div v-else class="computed-mini-cell">{{ formatCurrency(rec.quantity * template.unitValueInBirr) }}</div>
                      <div class="adj-cell" v-if="isView && donationStatus === 'approved'">
                        <button type="button" class="btn-adj mini" :class="{ 'is-returned': rec.is_returned }" :title="rec.is_returned ? 'Reassign' : 'Adjust'" @click.stop="rec.is_returned ? openReassign(row, rec) : openAdjustment(row, rec)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M9 17l3 3 3-3M12 4v6M9 7l3-3 3 3"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </transition>

        <div class="card-footer" v-if="filledRows.length > 0 || (isView && donationStatus === 'approved')">
          <div class="totals-block">
            <template v-if="isView && donationStatus === 'approved'">
              <div class="total-row">
                <span class="total-label">Donation Total:</span>
                <strong class="total-val">{{ formatCurrency(donationTotalValueInBirr) }}</strong>
              </div>
              <div class="total-row returned-row" v-if="returnedTotal > 0">
                <span class="total-label">Returned Items:</span>
                <strong class="total-val returned-val">+ {{ formatCurrency(returnedTotal) }}</strong>
              </div>
              <div class="total-divider" v-if="returnedTotal > 0"></div>
            </template>
            <div class="grand-total">
              <span>Grand Total:</span>
              <strong>{{ formatCurrency(grandTotal) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/donations" class="btn-outline">{{ isView ? 'Back to List' : 'Cancel' }}</router-link>
        
        <button v-if="isView && donationStatus === 'draft'" type="button" class="btn-primary" @click="submitForApproval" :disabled="isSubmitting">
          {{ isSubmitting ? 'Processing...' : 'Submit Donation' }}
        </button>

        <template v-if="isView && donationStatus === 'pending' && isCharityAdmin">
          <button type="button" class="btn-primary success" @click="approveDonation" :disabled="isSubmitting">Approve Donation</button>
          <button type="button" class="btn-outline danger" @click="showCommentForm = true" :disabled="isSubmitting">Return for Correction</button>
          <button type="button" class="btn-danger" @click="confirmRejectDonation" :disabled="isSubmitting">Reject Donation</button>
        </template>

        <button v-if="!isView" type="submit" class="btn-primary" :disabled="isSubmitting || filledRows.length === 0">
          {{ isSubmitting ? 'Processing...' : isEdit ? 'Update Donation' : 'Create Donation' }}
        </button>
      </div>
    </form>

    <div v-if="showCommentForm" class="comment-overlay">
      <div class="comment-modal">
        <div class="modal-header">
          <h3>Correction Feedback</h3>
          <button class="close-btn" @click="showCommentForm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Provide feedback to the Team Leader. The donation will be moved back to Draft.</p>
          <textarea v-model="formComment" placeholder="Enter comments here..." rows="4"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn-text" @click="showCommentForm = false">Cancel</button>
          <button class="btn-primary" @click="commentAndReturn" :disabled="isSubmitting || !formComment.trim()">Send Feedback</button>
        </div>
      </div>
    </div>

    <AdjustmentModal
      v-if="isAdjModalOpen"
      :is-open="isAdjModalOpen"
      :item="adjMockItem"
      :recurring="adjTargetRecurring"
      :beneficiaries="teamBeneficiaries"
      :is-reassign="isReassignModal"
      :request-to-edit="adjRequestToEdit"
      @close="closeAdjustmentModal"
      @success="handleAdjustmentSuccess"
    />

    <AdjustmentDetailModal
      v-if="selectedAdjRequest"
      :is-open="!!selectedAdjRequest"
      :request="selectedAdjRequest"
      :processing="isSubmitting"
      @close="selectedAdjRequest = null"
      @approve="handleApproveRequest"
      @reject="(req: any, text: string) => handleActionSubmitAdjRequest(req, 'reject', text)"
      @comment="(req: any, text: string) => handleActionSubmitAdjRequest(req, 'comment', text)"
      @resubmit="handleResubmitRequest"
    />

    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CharityService, { type CharityRequestApprove } from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'
import AdjustmentModal from './components/modals/adjustments/AdjustmentModal.vue'
import AdjustmentDetailModal from './components/modals/adjustments/AdjustmentDetailModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const isView = computed(() => !!route.params.id && !route.path.includes('edit'))
const isCharityAdmin = computed(() => ['admin', 'charity_admin'].includes(authStore.userRole || ''))

const donationId = computed(() => route.params.id ? Number(route.params.id) : null)
const donationStatus = ref('draft')
const donationComments = ref<any[]>([])
const activeDonationRequest = ref<any>(null)
const donationTotalValueInBirr = ref(0)
const formComment = ref('')
const showCommentForm = ref(false)
const isCommentsExpanded = ref(false)
const isInfoExpanded = ref(true)
const isTemplateExpanded = ref(true)
const isAllocationExpanded = ref(true)

const isAdjModalOpen = ref(false)
const adjTargetRow = ref<any>(null)
const adjTargetRecurring = ref<any>(null)
const adjRequestToEdit = ref<any>(null)
const isReassignModal = ref(false)
const selectedAdjRequest = ref<CharityRequestApprove | null>(null)

const form = reactive({ teamId: '', donationDeliveryDate: '', description: '' })
const template = reactive({ type: 'money', description: '', unitValueInBirr: 0, isRecurring: false })
const teams = ref<any[]>([]); const teamBeneficiaries = ref<any[]>([]); const rows = ref<any[]>([])
const loadingBens = ref(false); const isSubmitting = ref(false); const errors = ref<any>({}); const toasts = ref<any[]>([])
const allocationSearch = ref(''); const bulk = reactive({ value: null, recurringType: 'monthly', recurringCount: 0, paymentMethod: 'bank' })

const openAdjustment = (row: any, recurring: any = null) => {
  adjTargetRow.value = row; adjTargetRecurring.value = recurring; adjRequestToEdit.value = null; isAdjModalOpen.value = true;
}
const openReassign = (row: any, rec: any = null) => {
  adjTargetRow.value = row; adjTargetRecurring.value = rec; isReassignModal.value = true; isAdjModalOpen.value = true;
}
const closeAdjustmentModal = () => {
  isAdjModalOpen.value = false; isReassignModal.value = false; adjTargetRow.value = null; adjTargetRecurring.value = null; adjRequestToEdit.value = null;
}

const viewAdjustmentDetail = async (row: any, recurringId: number | null = null) => {
  if (!row.onAdjustment) return
  const adjs = Array.isArray(row.onAdjustment) ? row.onAdjustment : [row.onAdjustment]
  const targetAdj = adjs.find(a => (recurringId === null ? true : a.recurring_id === recurringId) && ['pending', 'commented'].includes(a.status))
  if (targetAdj) {
    const res = await CharityService.getRequestById(targetAdj.adjustment_id)
    if (res.success) selectedAdjRequest.value = res.data
  }
}

const pendingAdjustmentCount = computed(() => {
  let count = 0
  rows.value.forEach(r => {
    if (r.onAdjustment) {
      const adjs = Array.isArray(r.onAdjustment) ? r.onAdjustment : [r.onAdjustment]
      count += adjs.filter(a => ['pending', 'commented'].includes(a.status)).length
    }
  })
  return count
})

const returnedCount = computed(() => {
  let count = 0
  rows.value.forEach(row => {
    if (template.isRecurring) count += (row.recurrings || []).filter((rec: any) => rec.is_returned).length
    else if (row.is_returned) count++
  })
  return count
})

const isUnderAdjustment = (row: any, recId: number | null = null) => {
  if (!row.onAdjustment) return false
  const adjs = Array.isArray(row.onAdjustment) ? row.onAdjustment : [row.onAdjustment]
  return adjs.some(a => ['pending', 'commented'].includes(a.status) && (recId === null ? true : a.recurring_id === recId))
}

const rowHasValue = (row: any) => template.isRecurring ? row.recurringCount > 0 : row.value > 0
const rowValue = (row: any) => {
  if (!rowHasValue(row)) return 0
  if (template.isRecurring) {
    if (template.type === 'money') return row.recurrings.reduce((s: number, i: any) => s + (Number(i.total_value_in_birr || i.value) || 0), 0)
    return row.recurrings.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (template.unitValueInBirr || 0)), 0)
  }
  return template.type === 'money' ? (row.value || 0) : (row.value || 0) * (template.unitValueInBirr || 0)
}

const adjMockItem = computed(() => {
  if (!adjTargetRow.value) return null
  return {
    donationItemId: adjTargetRow.value.donationItemId,
    beneficiaryId: adjTargetRow.value.beneficiaryId,
    type: template.type,
    totalValueInBirr: rowValue(adjTargetRow.value),
    quantity: adjTargetRow.value.value,
    beneficiary: teamBeneficiaries.value.find(b => b.beneficiaryId === adjTargetRow.value.beneficiaryId),
    isRecurring: { recurring_type: adjTargetRow.value.recurringType, recurrings: adjTargetRow.value.recurrings }
  }
})

const handleAdjustmentSuccess = (msg: string) => { addToast(msg); loadInitialData(); }

const handleApproveRequest = async (req: CharityRequestApprove) => {
  if (!confirm('Approve this adjustment request?')) return
  isSubmitting.value = true
  const res = await CharityService.approveRequest(req.requestId)
  if (res.success) { addToast('✅ Adjustment approved'); selectedAdjRequest.value = null; loadInitialData(); }
  else addToast(res.error || 'Failed to approve', 'error')
  isSubmitting.value = false
}

const handleResubmitRequest = async (req: CharityRequestApprove, updatedData?: any) => {
  if (!confirm('Resubmit for approval?')) return
  isSubmitting.value = true
  const res = await CharityService.resubmitWorkflowRequest(req.requestId, updatedData)
  if (res.success) { addToast('✅ Adjustment resubmitted'); selectedAdjRequest.value = null; loadInitialData(); }
  else addToast(res.error || 'Failed to resubmit', 'error')
  isSubmitting.value = false
}

const handleActionSubmitAdjRequest = async (req: CharityRequestApprove, type: 'reject' | 'comment', text: string) => {
  isSubmitting.value = true
  const res = type === 'reject' ? await CharityService.rejectRequest(req.requestId, text) : await CharityService.commentRequest(req.requestId, text)
  if (res.success) { addToast(`✅ Request ${type === 'reject' ? 'rejected' : 'commented'}`); selectedAdjRequest.value = null; loadInitialData(); }
  else addToast(res.error || 'Operation failed', 'error')
  isSubmitting.value = false
}

const submitForApproval = async () => {
  if (!donationId.value || !confirm('Submit this donation for approval?')) return
  isSubmitting.value = true
  const res = await CharityService.submitDonation(donationId.value)
  if (res.success) { addToast('✅ Donation submitted'); loadInitialData(); }
  else addToast(res.error || 'Failed to submit', 'error')
  isSubmitting.value = false
}

const approveDonation = async () => {
  if (!activeDonationRequest.value || !confirm('Approve this donation?')) return
  isSubmitting.value = true
  const res = await CharityService.approveRequest(activeDonationRequest.value.requestId)
  if (res.success) { addToast('✅ Donation approved'); loadInitialData(); }
  else addToast(res.error || 'Failed to approve', 'error')
  isSubmitting.value = false
}

const confirmRejectDonation = async () => {
  const reason = prompt('Reason for rejection (this will cancel the donation):')
  if (reason === null) return
  if (!reason.trim()) return addToast('Reason is required', 'error')
  isSubmitting.value = true
  const res = await CharityService.rejectRequest(activeDonationRequest.value.requestId, reason)
  if (res.success) { addToast('❌ Donation rejected and cancelled'); loadInitialData(); }
  else addToast(res.error || 'Failed to reject', 'error')
  isSubmitting.value = false
}

const commentAndReturn = async () => {
  if (!activeDonationRequest.value) return
  isSubmitting.value = true
  const res = await CharityService.commentRequest(activeDonationRequest.value.requestId, formComment.value)
  if (res.success) { addToast('✅ Feedback sent; donation returned to draft'); formComment.value = ''; showCommentForm.value = false; loadInitialData(); }
  else addToast(res.error || 'Failed to submit feedback', 'error')
  isSubmitting.value = false
}

const filteredRows = computed(() => {
  if (!allocationSearch.value) return rows.value
  const q = allocationSearch.value.toLowerCase()
  return rows.value.filter(r => r.name.toLowerCase().includes(q))
})

const filledRows = computed(() => rows.value.filter(rowHasValue))

const applyBulkSettings = () => {
  if (rows.value.length === 0) return
  rows.value.forEach(row => {
    row.value = bulk.value; row.paymentMethod = bulk.paymentMethod
    if (template.isRecurring) { row.recurringType = bulk.recurringType; row.recurringCount = bulk.recurringCount; syncRecurrings(row) }
  })
  addToast(`Applied bulk values to ${rows.value.length} beneficiaries`)
}

const handleTeamChange = async () => {
  if (!form.teamId) { teamBeneficiaries.value = []; rows.value = []; return }
  loadingBens.value = true
  const res = await CharityService.getBeneficiariesByTeam(Number(form.teamId))
  if (res.success) {
    teamBeneficiaries.value = res.data
    rows.value = res.data.map((b: any) => ({ beneficiaryId: b.beneficiaryId, name: b.name, value: null, paymentMethod: 'bank', recurringType: 'monthly', recurringCount: 0, recurrings: [], isExpanded: false }))
  }
  loadingBens.value = false
}

const loadInitialData = async () => {
  const res = await CharityService.getTeams()
  if (res.success) teams.value = res.data
  if (isEdit.value || isView.value) {
    const dRes = await CharityService.getDonationById(String(route.params.id))
    if (dRes.success) {
      const d = dRes.data
      activeDonationRequest.value = d.activeRequest || null
      donationStatus.value = d.status
      donationComments.value = d.activeRequest?.comments || []
      donationTotalValueInBirr.value = Number(d.totalValueInBirr || 0)
      form.teamId = d.teamId; form.donationDeliveryDate = d.donationDeliveryDate; form.description = d.description || ''
      await handleTeamChange()
      if (d.items?.length > 0) {
        const first = d.items[0]; template.type = first.type; template.description = first.description; template.unitValueInBirr = Number(first.unitValueInBirr); template.isRecurring = !!first.isRecurring
        d.items.forEach((item: any) => {
          const row = rows.value.find(r => r.beneficiaryId === item.beneficiaryId)
          if (row) {
            row.donationItemId = item.donationItemId; row.onAdjustment = item.onAdjustment; row.paymentMethod = item.paymentMethod; row.is_returned = item.isReturned; row.isDelivered = item.isDelivered
            if (template.isRecurring && item.isRecurring) {
              row.recurringType = item.isRecurring.recurring_type; row.recurringCount = item.isRecurring.recurring_count
              row.recurrings = item.isRecurring.recurrings.map((rec: any) => ({ recurring_id: rec.recurring_id, total_value_in_birr: Number(rec.total_value_in_birr), quantity: Number(rec.quantity), payment_method: rec.payment_method, is_delivered: rec.is_delivered, is_returned: rec.is_returned }))
            } else row.value = template.type === 'money' ? Number(item.unitValueInBirr) : Number(item.quantity)
          }
        })
      }
    }
  }
}

const syncRecurrings = (row: any) => {
  if (!template.isRecurring || !row.recurringCount) { row.recurrings = []; row.isExpanded = false; return }
  if (row.recurrings.length === 0 && row.recurringCount > 0) row.isExpanded = true
  const newRecs = []
  for (let i = 0; i < row.recurringCount; i++) {
    const existing = row.recurrings[i]
    newRecs.push({
      recurring_id: i + 1,
      value: existing?.value ?? (template.type === 'money' ? (row.value || 0) : null),
      quantity: existing?.quantity ?? (template.type !== 'money' ? (row.value || 1) : 1),
      paymentMethod: existing?.paymentMethod ?? row.paymentMethod
    })
  }
  row.recurrings = newRecs
}

const returnedTotal = computed(() => {
  let total = 0
  rows.value.forEach(row => {
    if (template.isRecurring) row.recurrings?.forEach((rec: any) => { if (rec.is_returned) total += template.type === 'money' ? Number(rec.total_value_in_birr || 0) : Number(rec.quantity || 0) * (template.unitValueInBirr || 0) })
    else if (row.is_returned) total += rowValue(row)
  })
  return total
})

const grandTotal = computed(() => (isView.value && donationStatus.value === 'approved') ? donationTotalValueInBirr.value + returnedTotal.value : rows.value.reduce((sum, r) => sum + rowValue(r), 0))

const handleSubmit = async () => {
  errors.value = {}
  if (!form.teamId) errors.value.teamId = 'Team is required'
  if (!form.donationDeliveryDate) errors.value.donationDeliveryDate = 'Date is required'
  if (!template.description) return addToast('Item description is required', 'error')
  if (Object.keys(errors.value).length > 0) return
  if (filledRows.value.length === 0) return addToast('Add at least one beneficiary', 'error')
  isSubmitting.value = true
  const payload = { teamId: form.teamId, description: form.description, donationDeliveryDate: form.donationDeliveryDate, items: filledRows.value.map(buildItemPayload) }
  const donRes = isEdit.value ? await CharityService.updateDonation(Number(route.params.id), payload) : await CharityService.createDonation(payload)
  if (!donRes.success) { addToast(donRes.error || 'Failed to save', 'error'); isSubmitting.value = false; return }
  addToast(`✅ Donation saved`); setTimeout(() => router.push('/charity/donations'), 1500); isSubmitting.value = false
}

const buildItemPayload = (row: any) => {
  const isRecurring = template.isRecurring
  const recurringData = isRecurring ? {
    recurring_type: row.recurringType,
    recurring_count: row.recurringCount,
    start_date: form.donationDeliveryDate,
    recurrings: row.recurrings.map((rec: any, idx: number) => ({
      recurring_id: idx + 1,
      quantity: template.type === 'money' ? 1 : rec.quantity,
      unit_value_in_birr: template.type === 'money' ? rec.value : template.unitValueInBirr,
      total_value_in_birr: template.type === 'money' ? rec.value : (rec.quantity * template.unitValueInBirr),
      payment_method: rec.paymentMethod,
      is_delivered: false,
      is_returned: null
    }))
  } : null
  const base = {
    donationItemId: row.donationItemId,
    beneficiaryId: row.beneficiaryId,
    type: template.type,
    description: template.description,
    paymentMethod: row.paymentMethod,
    isRecurring: recurringData,
    isDelivered: false,
    bankReceipts: []
  }
  if (template.type === 'money') return { ...base, quantity: 1, unitValueInBirr: isRecurring ? 0 : row.value, totalValueInBirr: rowValue(row) }
  const totalQty = isRecurring ? row.recurrings.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) : row.value
  return { ...base, quantity: totalQty, unitValueInBirr: template.unitValueInBirr, totalValueInBirr: rowValue(row) }
}

const formatDate = (d: string) => CharityService.formatDate(d)
const formatCurrency = (v: number) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v || 0)
const addToast = (msg: string, type: string = 'success') => {
  const id = Date.now(); toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}
onMounted(loadInitialData)
</script>

<style scoped>
.donation-create { max-width: 1100px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; min-height: 100vh; }
.create-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
.header-main { display: flex; align-items: center; gap: 16px; }
.header-status { margin-left: auto; }
.status-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
.status-pill.draft { background: #f1f5f9; color: #475569; }
.status-pill.pending { background: #fef3c7; color: #b45309; }
.status-pill.approved { background: #dcfce7; color: #166534; }
.status-pill.cancelled { background: #fee2e2; color: #991b1b; }

.back-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; text-decoration: none; }
.header-title h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.header-title p { font-size: 14px; color: #64748b; margin-top: 4px; }

.donation-form { display: flex; flex-direction: column; gap: 24px; }
.form-card { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
.card-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: #fafcfd; border-bottom: 1px solid #f1f5f9; }
.card-header svg { width: 20px; height: 20px; color: #6a11cb; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #334155; margin: 0; }
.header-hint { margin-left: 8px; color: #94a3b8; font-size: 12px; font-weight: 400; }
.count-badge { font-size: 12px; padding: 4px 12px; background: #f5f3ff; color: #6a11cb; border-radius: 20px; font-weight: 600; }
.header-badges { margin-left: auto; display: flex; gap: 12px; align-items: center; }
.adj-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 4px 12px; background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; border-radius: 20px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.adj-badge svg { width: 14px; height: 14px; }
.returned-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 4px 12px; background: #ffbbc0; color: #b91c1c; border: 1px solid #f00; border-radius: 20px; font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.returned-badge svg { width: 14px; height: 14px; }
.card-body { padding: 24px; }

.bulk-settings-bar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
.bulk-inputs { display: flex; align-items: center; gap: 12px; flex: 1; }
.bulk-field input, .bulk-field select { padding: 8px 12px; font-size: 13px; border-radius: 10px; width: 140px; }
.btn-bulk-apply { padding: 8px 16px; background: #6a11cb; color: white; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-bulk-apply:hover { background: #7c3aed; transform: translateY(-1px); }
.list-search input { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; width: 200px; background: white; }
.list-search input:focus { border-color: #6a11cb; outline: none; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.req { color: #ef4444; }

input, select, textarea { padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; }
input:focus, select:focus, textarea:focus { border-color: #6a11cb; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1); }
input:disabled, select:disabled, textarea:disabled { background: #f8fafc; color: #94a3b8; }

.recurring-toggle { margin-top: 12px; padding: 12px; background: #fdfaff; border-radius: 12px; border: 1px solid #ede9fe; }
.toggle-container { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-label { font-weight: 600; color: #6d28d9; font-size: 14px; }

.comments-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #6a11cb; }
.comment-meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; }
.comment-author { font-weight: 700; color: #1e293b; }
.comment-date { color: #94a3b8; }
.comment-text { margin: 0; color: #475569; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }

.comment-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.comment-modal { background: white; border-radius: 24px; width: 100%; max-width: 500px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.comment-modal .modal-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
.comment-modal h3 { margin: 0; font-size: 20px; color: #1e293b; font-weight: 700; }
.comment-modal .close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.comment-modal .modal-body { padding: 32px; }
.comment-modal p { color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
.comment-modal textarea { width: 100%; border-radius: 16px; padding: 16px; border: 1px solid #e2e8f0; font-size: 15px; resize: none; outline: none; transition: border-color 0.2s; }
.comment-modal textarea:focus { border-color: #6a11cb; }
.comment-modal .modal-footer { padding: 20px 32px; background: #fafcfd; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }

.ben-table { background: #fcfcfd; }
.ben-header { display: grid; grid-template-columns: 2fr 180px 150px; gap: 12px; padding: 12px 24px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
.ben-header.recurring-grid { grid-template-columns: 2fr 180px 150px; }
.ben-header:has(.col-adj) { grid-template-columns: 2fr 150px 130px 100px; }

.ben-row-wrapper { border-bottom: 1px solid #f1f5f9; }
.ben-row { display: grid; grid-template-columns: 2fr 180px 150px; gap: 12px; align-items: center; padding: 12px 24px; background: white; transition: all 0.2s; cursor: pointer; }
.ben-row.recurring-grid { grid-template-columns: 2fr 180px 150px; }
.ben-row:has(.col-adj) { grid-template-columns: 2fr 150px 130px 100px; }
.ben-row.active { background: #fdfaff; }
.ben-row.under-adj, .details-row.under-adj { border-left: 5px solid #c2410ca3 !important; }
.ben-row.is-returned, .details-row.is-returned { background: #ffbbc0 !important; border-left: 5px solid #f00 !important; }

.btn-reassign { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #fca5a5; background: #fff1f2; color: #dc2626; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.btn-reassign:hover { background: #dc2626; color: white; border-color: #dc2626; }
.btn-reassign svg { width: 14px; height: 14px; }
.btn-reassign.mini { width: 24px; height: 24px; border-radius: 6px; }

.collapse-btn { background: none; border: none; padding: 4px; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.collapse-btn svg { width: 18px; height: 18px; transition: transform 0.3s ease; }
.collapse-btn.is-open svg { transform: rotate(180deg); color: #6a11cb; }

.recurring-details { margin: 0 24px 20px 62px; background: white; border: 1px solid #ddd6fe; border-radius: 12px; padding: 12px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
.details-header { display: grid; grid-template-columns: 1fr 120px 100px; gap: 12px; font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding: 0 8px 8px; margin-bottom: 8px; }
.details-header.goods-header { grid-template-columns: 1fr 120px 120px; }
.details-header.has-adj { grid-template-columns: 1fr 100px 90px 60px; }
.details-row { display: grid; grid-template-columns: 1fr 120px 100px; gap: 12px; align-items: center; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
.details-row.goods-row { grid-template-columns: 1fr 120px 120px; }
.details-row.has-adj { grid-template-columns: 1fr 100px 90px 60px; }
.details-row:hover { background: #f8fafc; }

.period-cell { font-size: 13px; color: #334155; font-weight: 500; display: flex; align-items: baseline; gap: 8px; }
.period-label { color: #94a3b8; font-weight: 600; font-size: 11px; }

.mini-input { width: 100%; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; font-weight: 600; text-align: right; color: #10b981; }
.mini-input:focus { border-color: #6a11cb; outline: none; }
.mini-select { width: 100%; padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; }
.computed-mini-cell { font-size: 12px; font-weight: 700; color: #10b981; text-align: right; }
.details-footer { margin-top: 12px; padding: 10px 8px 0; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; font-size: 13px; color: #475569; }
.details-footer strong { color: #7c3aed; font-size: 15px; }

.col-name { display: flex; align-items: center; gap: 10px; }
.ben-avatar { width: 28px; height: 28px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.ben-name { font-size: 14px; font-weight: 500; color: #334155; }
.header-icon { width: 14px; height: 14px; margin-left: 4px; vertical-align: middle; color: #f59e0b; }
.btn-adj { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin-left: auto; }
.btn-adj:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.btn-adj.is-returned:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
.btn-adj.mini { width: 24px; height: 24px; border-radius: 6px; }

.card-footer { padding: 24px; background: #fafcfd; border-top: 2px dashed #f1f5f9; }
.totals-block { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.total-row { display: flex; align-items: center; gap: 16px; font-size: 14px; color: #475569; }
.total-label { min-width: 140px; text-align: right; }
.total-val { font-size: 16px; font-weight: 700; color: #1e293b; min-width: 140px; text-align: right; }
.returned-val { color: #dc2626; }
.total-divider { width: 296px; height: 1px; background: #e2e8f0; margin: 2px 0; }
.grand-total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: 16px; color: #475569; }
.grand-total strong { font-size: 26px; color: #6a11cb; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.btn-outline { padding: 12px 28px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; color: #64748b; font-weight: 600; text-decoration: none; }
.btn-primary { padding: 12px 32px; border-radius: 12px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 700; cursor: pointer; }
.btn-primary.success { background: #10b981; }
.btn-danger { background: #ef4444; color: white; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-danger:hover { background: #dc2626; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-text { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; padding: 12px 20px; }

.loading-bens, .empty-bens { padding: 60px; text-align: center; color: #94a3b8; }
.mini-spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-header.collapsible-header { cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.comment-count-badge { font-size: 12px; font-weight: 600; background: #ede9fe; color: #6a11cb; padding: 2px 10px; border-radius: 20px; margin-left: 4px; }
.header-right .collapse-chevron { width: 20px; height: 20px; transition: transform 0.3s ease; color: #94a3b8; }
.collapse-chevron.rotated { transform: rotate(180deg); }
.collapse-enter-active, .collapse-leave-active { transition: all 0.3s ease; max-height: 3000px; overflow: hidden; }
.collapse-enter-from, .collapse-leave-to { max-height: 0; opacity: 0; }
@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>
