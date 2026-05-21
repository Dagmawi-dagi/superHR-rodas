<template>
  <div class="donation-create">
    <!-- Back header -->
    <div class="create-header">
      <router-link to="/charity/donations" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" /></svg>
      </router-link>
      <div class="header-title">
        <h1>{{ isView ? 'View Donation' : isEdit ? 'Edit Donation Batch' : 'New Donation Batch' }}</h1>
        <p>{{ isView ? 'Detailed breakdown' : 'Allocate donation items to beneficiaries within a team' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="donation-form">
      
      <!-- ═══════════════ STEP 1: BATCH INFO (Stacked) ═══════════════ -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4m16 5H4m16 5H4"/></svg>
          <h3>Batch Information</h3>
        </div>
        <div class="card-body">
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
            <label>Batch Description</label>
            <textarea v-model="form.description" rows="2" placeholder="e.g. Winter Clothing Drive 2024" :disabled="isView"></textarea>
          </div>
        </div>
      </div>

      <!-- ═══════════════ STEP 2: ITEM TEMPLATE (Stacked) ═══════════════ -->
      <div class="form-card" v-if="form.teamId">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <h3>Item Template</h3>
          <small class="header-hint">Define what is being distributed to all selected beneficiaries</small>
        </div>
        <div class="card-body">
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
      </div>

      <!-- ═══════════════ STEP 3: BENEFICIARY ALLOCATION (TABLE STYLE) ═══════════════ -->
      <div class="form-card" v-if="form.teamId">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <h3>Beneficiary Allocation</h3>
          <span class="count-badge">{{ teamBeneficiaries.length }} beneficiaries in team</span>
        </div>
        
        <div class="card-body ">
          <!-- ── BULK SETTINGS BAR ── --> 
          <div v-if="!isView" class="flex mw-100px gap-2 mb-3!  text-base font-bold text-slate-700 text-xs" >
            <span style="width: 16px;">
               <svg viewBox="0 0 24 24" fill="none"  stroke="#6a11cb" stroke-width="2" class="icon-sm"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

              <button type="button" class="btn-bulk-apply" @click="applyBulkSettings">
                Apply to All
              </button>
            </div>

            <div class="list-search">
              <input type="text" v-model="allocationSearch" placeholder="Search in list..." />
            </div>
          </div>

          <div v-if="loadingBens" class="loading-bens">
            <div class="mini-spinner"></div>
            Loading team beneficiaries...
          </div>
          <div v-else-if="teamBeneficiaries.length === 0" class="empty-bens">
            No beneficiaries found for this team.
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
                </template>
              </div>

              <div v-for="row in filteredRows" :key="row.beneficiaryId" class="ben-row-wrapper">
                <div class="ben-row" :class="{ 'active': rowHasValue(row), 'recurring-grid': template.isRecurring }">
                  <div class="col-name">
                    <button 
                      v-if="template.isRecurring && row.recurringCount > 0"
                      type="button"
                      class="collapse-btn"
                      :class="{ 'is-open': row.isExpanded }"
                      @click="row.isExpanded = !row.isExpanded"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <div class="ben-avatar">{{ row.name[0] }}</div>
                    <span class="ben-name text-truncate">{{ row.name }}</span>
                  </div>

                  <template v-if="template.isRecurring">
                    <div class="col-int">
                      <select v-model="row.recurringType" @change="syncRecurrings(row)" :disabled="isView">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div class="col-count">
                      <input type="number" v-model.number="row.recurringCount" min="0" placeholder="0" @input="syncRecurrings(row)" :disabled="isView" />
                    </div>
                  </template>

                  <template v-else>
                    <div class="col-input">
                      <input 
                        type="number" 
                        v-model.number="row.value" 
                        step="0.01" 
                        min="0" 
                        :placeholder="template.type === 'money' ? '0.00' : '0'"
                        :disabled="isView"
                      />
                    </div>
                    <div class="col-method" v-if="template.type === 'money'">
                      <select v-model="row.paymentMethod" :disabled="isView">
                        <option value="bank">Bank</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div class="col-total" v-if="template.type !== 'money'">
                      <span class="computed-val">{{ formatCurrency(rowValue(row)) }}</span>
                    </div>
                  </template>
                </div>
                
                <!-- ── RECURRING DETAILS (TABLE STYLE) ── -->
                <div class="recurring-details" v-if="template.isRecurring && row.recurringCount > 0 && row.isExpanded">
                  <div class="details-header" :class="{ 'goods-header': template.type !== 'money' }">
                    <span>Period ID</span>
                    <span>{{ template.type === 'money' ? 'Value (ETB)' : 'Quantity' }}</span>
                    <span v-if="template.type === 'money'">Method</span>
                    <span v-if="template.type !== 'money'">Subtotal</span>
                  </div>
                  <div v-for="(rec, idx) in row.recurrings" :key="idx" class="details-row" :class="{ 'goods-row': template.type !== 'money' }">
                    <div class="period-cell">
                      <small class="period-label">{{ row.recurringType.charAt(0).toUpperCase() + row.recurringType.slice(1) }}#{{ idx + 1 }}</small>
                    </div>
                    <div class="val-input-wrap">
                      <input 
                        v-if="template.type === 'money'"
                        type="number" step="0.01" 
                        v-model.number="rec.value" 
                        class="mini-input"
                        :disabled="isView"
                      />
                      <input 
                        v-else
                        type="number" 
                        v-model.number="rec.quantity" 
                        class="mini-input"
                        :disabled="isView"
                      />
                    </div>
                    <div v-if="template.type === 'money'" class="method-box">
                      <select v-model="rec.paymentMethod" class="mini-select" :disabled="isView">
                        <option value="bank">Bank</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                    <div v-else class="computed-mini-cell">
                      {{ formatCurrency(rec.quantity * template.unitValueInBirr) }}
                    </div>
                  </div>
                  <div class="details-footer">
                    <span>Beneficiary Subtotal:</span>
                    <strong>{{ formatCurrency(rowValue(row)) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="card-footer" v-if="filledRows.length > 0">
          <div class="grand-total">
            <span>Batch Grand Total:</span>
            <strong>{{ formatCurrency(grandTotal) }}</strong>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/donations" class="btn-outline">{{ isView ? 'Back to List' : 'Cancel' }}</router-link>
        <button v-if="!isView" type="submit" class="btn-primary" :disabled="isSubmitting || filledRows.length === 0">
          {{ isSubmitting ? 'Processing...' : isEdit ? 'Update Batch' : 'Create Batch' }}
        </button>
      </div>
    </form>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CharityService from '@/stores/charity'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const isView = computed(() => !!route.params.id && !route.path.includes('edit'))

// Main Batch Info
const form = reactive({
  teamId: '',
  donationDeliveryDate: '',
  description: '',
})

// Item Template (applied to all)
const template = reactive({
  type: 'money',
  description: '',
  unitValueInBirr: 0,
  isRecurring: false
})

const teams = ref<any[]>([])
const teamBeneficiaries = ref<any[]>([])
const rows = ref<any[]>([])
const loadingBens = ref(false)
const isSubmitting = ref(false)
const errors = ref<any>({})
const toasts = ref<any[]>([])

// Bulk & Search State
const allocationSearch = ref('')
const bulk = reactive({
  value: null,
  recurringType: 'monthly',
  recurringCount: 0,
  paymentMethod: 'bank'
})

const filteredRows = computed(() => {
  if (!allocationSearch.value) return rows.value
  const q = allocationSearch.value.toLowerCase()
  return rows.value.filter(r => r.name.toLowerCase().includes(q))
})

const applyBulkSettings = () => {
  if (rows.value.length === 0) return
  
  rows.value.forEach(row => {
    row.value = bulk.value
    row.paymentMethod = bulk.paymentMethod
    if (template.isRecurring) {
      row.recurringType = bulk.recurringType
      row.recurringCount = bulk.recurringCount
      syncRecurrings(row)
    }
  })
  
  addToast(`Applied bulk values to ${rows.value.length} beneficiaries`)
}

const loadInitialData = async () => {
  const res = await CharityService.getTeams()
  if (res.success) teams.value = res.data

  if (isEdit.value || isView.value) {
    const dRes = await CharityService.getDonationById(String(route.params.id))
    if (dRes.success) {
      const d = dRes.data
      form.teamId = d.teamId
      form.donationDeliveryDate = d.donationDeliveryDate
      form.description = d.description || ''
      
      await handleTeamChange()
      
      if (d.items && d.items.length > 0) {
        const first = d.items[0]
        template.type = first.type
        template.description = first.description
        template.unitValueInBirr = Number(first.unitValueInBirr)
        template.isRecurring = !!first.isRecurring

        d.items.forEach((item: any) => {
          const row = rows.value.find(r => r.beneficiaryId === item.beneficiaryId)
          if (row) {
            row.donationItemId = item.donationItemId
            row.paymentMethod = item.paymentMethod
            if (template.isRecurring && item.isRecurring) {
              row.recurringType = item.isRecurring.recurring_type
              row.recurringCount = item.isRecurring.recurring_count
              row.recurrings = item.isRecurring.recurrings.map((rec: any) => ({
                value: Number(rec.total_value_in_birr),
                quantity: Number(rec.quantity),
                paymentMethod: rec.payment_method
              }))
            } else {
              row.value = template.type === 'money' ? Number(item.unitValueInBirr) : Number(item.quantity)
            }
          }
        })
      }
    }
  }
}

const handleTeamChange = async () => {
  if (!form.teamId) {
    teamBeneficiaries.value = []
    rows.value = []
    return
  }
  loadingBens.value = true
  const res = await CharityService.getBeneficiariesByTeam(Number(form.teamId))
  if (res.success) {
    teamBeneficiaries.value = res.data
    rows.value = res.data.map((b: any) => ({
      beneficiaryId: b.beneficiaryId,
      name: b.name,
      value: null,
      paymentMethod: 'bank',
      recurringType: 'monthly',
      recurringCount: 0,
      recurrings: [],
      isExpanded: false
    }))
  }
  loadingBens.value = false
}

const syncRecurrings = (row: any) => {
  if (!template.isRecurring || !row.recurringCount) {
    row.recurrings = []
    row.isExpanded = false
    return
  }
  if (row.recurrings.length === 0 && row.recurringCount > 0) {
    row.isExpanded = true
  }
  const newRecs = []
  for (let i = 0; i < row.recurringCount; i++) {
    const existing = row.recurrings[i]
    newRecs.push({
      value: existing?.value ?? (template.type === 'money' ? (row.value || 0) : null),
      quantity: existing?.quantity ?? (template.type !== 'money' ? (row.value || 1) : 1),
      paymentMethod: existing?.paymentMethod ?? row.paymentMethod
    })
  }
  row.recurrings = newRecs
}

const rowHasValue = (row: any) => {
  if (template.isRecurring) return row.recurringCount > 0
  return row.value > 0
}

const rowValue = (row: any) => {
  if (!rowHasValue(row)) return 0
  if (template.isRecurring) {
    if (template.type === 'money') {
      return row.recurrings.reduce((s: number, i: any) => s + (Number(i.value) || 0), 0)
    } else {
      const uv = template.unitValueInBirr || 0
      return row.recurrings.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * uv), 0)
    }
  }
  if (template.type === 'money') return row.value || 0
  return (row.value || 0) * (template.unitValueInBirr || 0)
}

const filledRows = computed(() => rows.value.filter(rowHasValue))
const grandTotal = computed(() => rows.value.reduce((sum, r) => sum + rowValue(r), 0))

const formatCurrency = (v: number) => CharityService.formatCurrency(v)

const handleSubmit = async () => {
  errors.value = {}
  if (!form.teamId) errors.value.teamId = 'Team is required'
  if (!form.donationDeliveryDate) errors.value.donationDeliveryDate = 'Date is required'
  if (!template.description) {
    addToast('Item description is required', 'error')
    return
  }
  if (Object.keys(errors.value).length > 0) return
  if (filledRows.value.length === 0) {
    addToast('Add at least one beneficiary with a value before saving', 'error')
    return
  }

  isSubmitting.value = true

  // 1. Create or update the donation (including items)
  const donationPayload = {
    teamId: form.teamId,
    description: form.description,
    donationDeliveryDate: form.donationDeliveryDate,
    items: filledRows.value.map(row => buildItemPayload(row))
  }

  const donRes = isEdit.value
    ? await CharityService.updateDonation(Number(route.params.id), donationPayload)
    : await CharityService.createDonation(donationPayload)

  if (!donRes.success) {
    addToast(donRes.error || 'Failed to save donation', 'error')
    isSubmitting.value = false
    return
  }

  addToast(`✅ Donation batch saved successfully`)
  setTimeout(() => router.push('/charity/donations'), 1500)
  isSubmitting.value = false
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
  if (template.type === 'money') {
    return { ...base, quantity: 1, unitValueInBirr: isRecurring ? 0 : row.value, totalValueInBirr: rowValue(row) }
  } else {
    const totalQty = isRecurring ? row.recurrings.reduce((s: number, i: any) => s + (Number(i.quantity) || 0), 0) : row.value
    return { ...base, quantity: totalQty, unitValueInBirr: template.unitValueInBirr, totalValueInBirr: rowValue(row) }
  }
}

const addToast = (msg: string, type: string = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

onMounted(loadInitialData)
</script>

<style scoped>
.donation-create { max-width: 1100px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; min-height: 100vh; }
.create-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.back-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; text-decoration: none; }
.header-title h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.header-title p { font-size: 14px; color: #64748b; margin-top: 4px; }

.donation-form { display: flex; flex-direction: column; gap: 24px; }
.form-card { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
.card-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: #fafcfd; border-bottom: 1px solid #f1f5f9; }
.card-header svg { width: 20px; height: 20px; color: #6a11cb; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #334155; margin: 0; }
.header-hint { margin-left: 8px; color: #94a3b8; font-size: 12px; font-weight: 400; }
.count-badge { margin-left: auto; font-size: 12px; padding: 4px 12px; background: #f5f3ff; color: #6a11cb; border-radius: 20px; font-weight: 600; }
.card-body { padding: 24px; }

/* Bulk Settings Bar */
.bulk-settings-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; padding: 16px 20px; background: #f8fafc;
  border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px;
}
.bulk-label { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #334155; font-size: 13px; }
.bulk-inputs { display: flex; align-items: center; gap: 12px; flex: 1; }
.bulk-field input, .bulk-field select { padding: 8px 12px; font-size: 13px; border-radius: 10px; width: 140px; }
.btn-bulk-apply { 
  padding: 8px 16px; background: #6a11cb; color: white; border: none; 
  border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.btn-bulk-apply:hover { background: #7c3aed; transform: translateY(-1px); }

.list-search input { 
  padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 10px; 
  font-size: 13px; width: 200px; background: white;
}
.list-search input:focus { border-color: #6a11cb; outline: none; }

.card-body.no-padding { padding: 0; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.req { color: #ef4444; }

input, select, textarea {
  padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s;
}
input:focus, select:focus, textarea:focus { border-color: #6a11cb; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1); }
input:disabled, select:disabled, textarea:disabled { background: #f8fafc; color: #94a3b8; }

.recurring-toggle { margin-top: 12px; padding: 12px; background: #fdfaff; border-radius: 12px; border: 1px solid #ede9fe; }
.toggle-container { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-label { font-weight: 600; color: #6d28d9; font-size: 14px; }

/* Ben Table */
.ben-table { background: #fcfcfd; }
.ben-header { display: grid; grid-template-columns: 2fr 180px 150px; gap: 12px; padding: 12px 24px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
.ben-header.recurring-grid { grid-template-columns: 2fr 180px 150px; }

.ben-row-wrapper { border-bottom: 1px solid #f1f5f9; }
.ben-row { display: grid; grid-template-columns: 2fr 180px 150px; gap: 12px; align-items: center; padding: 12px 24px; background: white; transition: all 0.2s; }
.ben-row.recurring-grid { grid-template-columns: 2fr 180px 150px; }
.ben-row.active { background: #fdfaff; }

/* Collapse Button */
.collapse-btn {
  background: none; border: none; padding: 4px; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.collapse-btn svg { width: 18px; height: 18px; transition: transform 0.3s ease; }
.collapse-btn.is-open svg { transform: rotate(180deg); color: #6a11cb; }

/* Recurring Details (Mini Table) */
.recurring-details { 
  margin: 0 24px 20px 62px; 
  background: white; 
  border: 1px solid #ddd6fe; 
  border-radius: 12px; 
  padding: 12px; 
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.details-header { 
  display: grid; 
  grid-template-columns: 1fr 120px 100px; 
  gap: 12px; 
  font-size: 11px; 
  font-weight: 700; 
  color: #7c3aed; 
  text-transform: uppercase; 
  border-bottom: 1px solid #f1f5f9; 
  padding: 0 8px 8px;
  margin-bottom: 8px; 
}
.details-header.goods-header { grid-template-columns: 1fr 120px 120px; }

.details-row { 
  display: grid; 
  grid-template-columns: 1fr 120px 100px; 
  gap: 12px; 
  align-items: center; 
  padding: 6px 8px;
  border-radius: 6px;
}
.details-row.goods-row { grid-template-columns: 1fr 120px 120px; }
.details-row:hover { background: #f8fafc; }

.period-cell { font-size: 13px; color: #334155; font-weight: 500; display: flex; align-items: baseline; gap: 8px; }
.period-label { color: #94a3b8; font-weight: 600; font-size: 11px; }

.mini-input { 
  width: 100%; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; 
  font-size: 12px; font-weight: 600; text-align: right; color: #10b981;
}
.mini-input:focus { border-color: #6a11cb; outline: none; }
.mini-select { width: 100%; padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; }

.computed-mini-cell { font-size: 12px; font-weight: 700; color: #10b981; text-align: right; }

.details-footer { 
  margin-top: 12px; 
  padding: 10px 8px 0; 
  border-top: 1px solid #f1f5f9; 
  display: flex; 
  justify-content: flex-end; 
  gap: 12px; 
  font-size: 13px; 
  color: #475569;
}
.details-footer strong { color: #7c3aed; font-size: 15px; }

.col-name { display: flex; align-items: center; gap: 10px; }
.ben-avatar { width: 28px; height: 28px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
.ben-name { font-size: 14px; font-weight: 500; color: #334155; }

.ben-row input, .ben-row select { padding: 6px 10px; font-size: 13px; width: 100%; }
.computed-val { font-weight: 700; color: #10b981; font-size: 13px; text-align: right; display: block; }

.card-footer { padding: 24px; background: #fafcfd; border-top: 2px dashed #f1f5f9; }
.grand-total { display: flex; justify-content: flex-end; align-items: center; gap: 16px; font-size: 16px; color: #475569; }
.grand-total strong { font-size: 26px; color: #6a11cb; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
.btn-outline { padding: 12px 28px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; color: #64748b; font-weight: 600; text-decoration: none; }
.btn-primary { padding: 12px 32px; border-radius: 12px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 700; cursor: pointer; }

.loading-bens, .empty-bens { padding: 60px; text-align: center; color: #94a3b8; }
.mini-spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

@media (max-width: 768px) { 
  .form-row { grid-template-columns: 1fr; }
}
</style>
