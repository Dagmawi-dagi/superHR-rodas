<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEdit ? 'Edit Donation Item' : 'Add Donation Item' }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <form @submit.prevent="handleSubmit">

        <!-- ═══════════════ ITEM DETAILS ═══════════════ -->
        <div class="section">
          <h4 class="section-title">Item Details</h4>

          <div class="form-row">
            <!-- Type -->
            <div class="form-group">
              <label>Type <span class="req">*</span></label>
              <select v-model="form.type" :disabled="isEdit">
                <option value="">Select type</option>
                <option value="money">Money</option>
                <option value="goods">Goods</option>
                <option value="service">Service</option>
              </select>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label>Description</label>
              <input v-model="form.description" placeholder="e.g. School Registration Fee" />
            </div>
          </div>

          <!-- Unit Value — goods & service only -->
          <div class="form-row" v-if="form.type && form.type !== 'money'">
            <div class="form-group">
              <label>Unit Value (ETB per unit) <span class="req">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                v-model.number="form.unitValue"
                placeholder="0.00"
              />
              <small class="hint">Each beneficiary's quantity × this value = their item value.</small>
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end;">
              <div class="computed-box" v-if="form.unitValue > 0">
                <span class="computed-label">Grand Total (all beneficiaries)</span>
                <span class="computed-value">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Money: show running total only -->
          <div class="totals-bar" v-if="form.type === 'money' && rows.length > 0">
            <span class="total-label">Total Amount</span>
            <span class="total-value">{{ formatCurrency(grandTotal) }}</span>
          </div>
          <div class="totals-bar" v-if="form.type !== 'money' && form.type && form.unitValue > 0 && rows.length > 0">
            <span class="total-label">Total Qty: {{ totalQty }}</span>
            <span class="total-value">{{ formatCurrency(grandTotal) }}</span>
          </div>

          <!-- Recurring -->
          <div class="recurring-row">
            <label class="toggle-label">
              <span class="custom-checkbox">
                <input type="checkbox" v-model="form.isRecurring" />
                <span class="checkmark"></span>
              </span>
              Recurring payment
            </label>
          </div>

          <template v-if="form.isRecurring">
            <div class="form-row">
              <div class="form-group">
                <label>Interval</label>
                <select v-model="form.intervalType">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div class="form-group">
                <label>Number of intervals</label>
                <input type="number" min="1" v-model.number="form.intervalCount" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" v-model="form.intervalStartDate" />
              </div>
              <div class="form-group">
                <label>Computed End Date</label>
                <input :value="computedEndDate" disabled />
              </div>
            </div>
            <div class="interval-totals" v-if="grandTotal > 0">
              <div class="itotal-row">
                <span>Per-interval total</span>
                <strong>{{ formatCurrency(perIntervalTotal) }}</strong>
              </div>
              <div class="itotal-row">
                <span>Grand total (all {{ form.intervalCount }} intervals)</span>
                <strong>{{ formatCurrency(grandTotal * form.intervalCount) }}</strong>
              </div>
            </div>
          </template>
        </div>

        <!-- ═══════════════ BENEFICIARY ENTRIES ═══════════════ -->
        <div class="section">
          <h4 class="section-title">
            Beneficiaries
            <span class="section-subtitle">Enter values for each beneficiary in your group</span>
          </h4>

          <!-- Loading beneficiaries -->
          <div v-if="loadingBens" class="loading-bens">
            <div class="mini-spinner"></div>
            Loading your beneficiaries...
          </div>

          <!-- No beneficiaries -->
          <div v-else-if="myBeneficiaries.length === 0" class="no-bens">
            <p>No beneficiaries found in your group. Ask your charity admin to assign beneficiaries.</p>
          </div>

          <!-- Beneficiary table -->
          <template v-else>
            <div class="ben-table-header">
              <span class="col-name">Beneficiary</span>
              <span class="col-type">Type</span>
              <template v-if="form.type === 'money'">
                <span class="col-amount">Amount (ETB)</span>
                <span class="col-method">Payment Method</span>
              </template>
              <template v-else-if="form.type">
                <span class="col-qty">Quantity</span>
                <span class="col-value">Value</span>
              </template>
            </div>

            <div
              v-for="row in rows"
              :key="row.beneficiaryId"
              class="ben-row"
              :class="{ 'has-value': rowHasValue(row) }"
            >
              <!-- Name -->
              <div class="col-name">
                <div class="ben-avatar">{{ row.name.charAt(0) }}</div>
                <span class="ben-name">{{ row.name }}</span>
              </div>

              <!-- Type badge -->
              <div class="col-type">
                <span class="type-badge" :class="row.benType">{{ row.benType }}</span>
              </div>

              <!-- Money inputs -->
              <template v-if="form.type === 'money'">
                <div class="col-amount">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    v-model.number="row.amount"
                    placeholder="0.00"
                    class="amount-input"
                  />
                </div>
                <div class="col-method">
                  <select v-model="row.paymentMethod" class="method-select">
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </template>

              <!-- Goods / Service inputs -->
              <template v-else-if="form.type">
                <div class="col-qty">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    v-model.number="row.quantity"
                    placeholder="0"
                    class="qty-input"
                  />
                </div>
                <div class="col-value">
                  <span class="calc-value" :class="{ 'calc-positive': rowValue(row) > 0 }">
                    {{ form.unitValue > 0 ? formatCurrency(rowValue(row)) : '—' }}
                  </span>
                </div>
              </template>
            </div>

            <!-- Summary footer -->
            <div class="ben-table-footer" v-if="filledRows.length > 0">
              <span>{{ filledRows.length }} of {{ rows.length }} beneficiar{{ filledRows.length === 1 ? 'y' : 'ies' }} assigned</span>
              <strong>Total: {{ formatCurrency(grandTotal) }}</strong>
            </div>
          </template>
        </div>

        <!-- ═══════════════ PROGRESS (multi-submit) ═══════════════ -->
        <div class="progress-section" v-if="submitProgress.active">
          <div class="progress-bar-wrap">
            <div
              class="progress-bar"
              :style="{ width: `${(submitProgress.done / submitProgress.total) * 100}%` }"
            ></div>
          </div>
          <p class="progress-text">
            Saving item {{ submitProgress.done }} of {{ submitProgress.total }}...
          </p>
        </div>

        <!-- ═══════════════ ERRORS ═══════════════ -->
        <div class="error-list" v-if="formErrors.length">
          <p v-for="err in formErrors" :key="err" class="error-item">⚠ {{ err }}</p>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-outline" :disabled="submitProgress.active">
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!canSubmit || submitProgress.active"
          >
            {{ submitProgress.active
              ? `Saving ${submitProgress.done}/${submitProgress.total}...`
              : isEdit
                ? 'Save Changes'
                : `Add Items (${filledRows.length} beneficiar${filledRows.length === 1 ? 'y' : 'ies'})`
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import CharityService from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  donationId: { type: Number, required: true },
  itemToEdit: { type: Object, default: null },
  preSelectedBeneficiaryId: { type: Number, default: null },
})
const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()
const isEdit = computed(() => !!props.itemToEdit)

// ── My group's beneficiaries ─────────────────────────────────────────────────
const loadingBens    = ref(false)
const myBeneficiaries = ref([])      // raw beneficiaries from API

// rows: one row per beneficiary, holds their input values
const rows = ref([])

const loadMyBeneficiaries = async () => {
  loadingBens.value = true
  try {
    let bens = []
    const grpRes = await CharityService.getMyGroup()
    if (grpRes.success && grpRes.data?.length) {
      const groupId = grpRes.data[0].groupId
      const benRes = await CharityService.getGroupBeneficiaries(groupId)
      if (benRes.success) {
        bens = benRes.data
      }
    }

    if (props.preSelectedBeneficiaryId) {
      bens = bens.filter(b => b.beneficiaryId === props.preSelectedBeneficiaryId)
    }
    myBeneficiaries.value = bens
    buildRows(bens)
  } finally {
    loadingBens.value = false
  }
}

const buildRows = (beneficiaries) => {
  rows.value = beneficiaries.map(b => ({
    beneficiaryId: b.beneficiaryId,
    name: b.name,
    benType: b.type,
    amount: null,          // money type
    paymentMethod: 'bank', // money type — per beneficiary
    quantity: null,        // goods/service type
  }))
}

// ── Form state ───────────────────────────────────────────────────────────────
const form = reactive({
  type: 'money',
  description: '',
  unitValue: 0,
  isRecurring: false,
  intervalType: 'monthly',
  intervalCount: 1,
  intervalStartDate: '',
})

// ── Computed totals ──────────────────────────────────────────────────────────
const rowHasValue = (row) => {
  if (form.type === 'money') return row.amount > 0
  return row.quantity > 0
}

const rowValue = (row) => {
  if (form.type === 'money') return parseFloat(row.amount) || 0
  return (parseFloat(row.quantity) || 0) * (parseFloat(form.unitValue) || 0)
}

const filledRows = computed(() => rows.value.filter(rowHasValue))
const totalQty   = computed(() => rows.value.reduce((s, r) => s + (parseFloat(r.quantity) || 0), 0))

const perIntervalTotal = computed(() => {
  if (form.type === 'money') {
    return rows.value.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  }
  return rows.value.reduce((s, r) => s + rowValue(r), 0)
})

const grandTotal = computed(() => {
  return perIntervalTotal.value
  // Note: grandTotal over ALL intervals is perIntervalTotal × intervalCount
  // Shown separately in the interval-totals block
})

// ── Computed end date ────────────────────────────────────────────────────────
const computedEndDate = computed(() => {
  if (!form.intervalStartDate) return ''
  const date = new Date(form.intervalStartDate)
  if (form.intervalType === 'daily')        date.setDate(date.getDate() + form.intervalCount - 1)
  else if (form.intervalType === 'weekly')  date.setDate(date.getDate() + form.intervalCount * 7 - 1)
  else if (form.intervalType === 'monthly') date.setMonth(date.getMonth() + form.intervalCount)
  return date.toISOString().split('T')[0]
})

// ── Validation ───────────────────────────────────────────────────────────────
const formErrors = computed(() => {
  const errors = []
  if (!form.type) errors.push('Please select an item type.')
  if (form.type !== 'money' && !(parseFloat(form.unitValue) > 0))
    errors.push('Unit Value must be greater than 0 for goods and service items.')
  if (filledRows.value.length === 0)
    errors.push('Enter a value for at least one beneficiary.')
  if (form.isRecurring && !form.intervalStartDate)
    errors.push('Please set a start date for the recurring interval.')
  return errors
})

const canSubmit = computed(() => formErrors.value.length === 0)

// ── Submit progress ───────────────────────────────────────────────────────────
const submitProgress = reactive({ active: false, done: 0, total: 0 })

// ── Editing: pre-fill form ────────────────────────────────────────────────────
watch(() => props.itemToEdit, (item) => {
  if (item) {
    form.type        = item.type
    form.description = item.description || ''
    form.unitValue   = item.type === 'money' ? 0 : (parseFloat(item.unitValue) || 0)
    form.isRecurring = !!item.isRecurring
    if (item.isRecurring && item.DonationItemIntervals?.length) {
      const iv = item.DonationItemIntervals[0]
      form.intervalType       = iv.intervalType
      form.intervalCount      = iv.intervalCount
      form.intervalStartDate  = iv.startDate
    }
    // Pre-fill the matching row
    rows.value.forEach(r => {
      if (r.beneficiaryId === item.beneficiaryId) {
        if (item.type === 'money') {
          r.amount        = parseFloat(item.totalValue) || 0
          r.paymentMethod = item.paymentMethod || 'bank'
        } else {
          r.quantity = parseFloat(item.quantity) || 0
        }
      }
    })
  }
}, { immediate: true })

// Reset rows when type changes so stale values don't accumulate
watch(() => form.type, () => {
  rows.value.forEach(r => { r.amount = null; r.quantity = null })
})

// ── Submit ────────────────────────────────────────────────────────────────────
async function handleSubmit() {
  if (!canSubmit.value) return

  const itemsToSave = filledRows.value
  submitProgress.active = true
  submitProgress.done   = 0
  submitProgress.total  = itemsToSave.length

  const interval = form.isRecurring && form.intervalStartDate ? {
    intervalType:  form.intervalType,
    intervalCount: form.intervalCount,
    startDate:     form.intervalStartDate,
  } : null

  const errors = []

  if (isEdit.value && props.itemToEdit) {
    // Edit mode: update just this one item
    const row = rows.value.find(r => r.beneficiaryId === props.itemToEdit.beneficiaryId) || itemsToSave[0]
    const payload = buildPayload(row, interval)
    const res = await CharityService.updateDonationItem(props.itemToEdit.donationItemId, payload)
    if (!res.success) errors.push(res.error || 'Failed to update item')
    submitProgress.done = 1
  } else {
    // Add mode: create one item per beneficiary
    for (const row of itemsToSave) {
      const payload = buildPayload(row, interval)
      const res = await CharityService.addDonationItem(props.donationId, payload)
      if (!res.success) errors.push(`${row.name}: ${res.error || 'Failed'}`)
      submitProgress.done++
    }
  }

  submitProgress.active = false

  if (errors.length) {
    alert('Some items failed:\n' + errors.join('\n'))
  }
  emit('saved')
}

function buildPayload(row, interval) {
  if (form.type === 'money') {
    const amount = Math.round(parseFloat(row.amount) * 100) / 100
    return {
      beneficiaryId:  row.beneficiaryId,
      type:           'money',
      description:    form.description,
      quantity:       1,
      unitValue:      amount,
      paymentMethod:  row.paymentMethod || 'bank',
      ...(interval ? { interval } : {}),
    }
  } else {
    const qty = Math.round(parseFloat(row.quantity) * 100) / 100
    const uv  = Math.round(parseFloat(form.unitValue) * 100) / 100
    return {
      beneficiaryId: row.beneficiaryId,
      type:          form.type,
      description:   form.description,
      quantity:      qty,
      unitValue:     uv,
      ...(interval ? { interval } : {}),
    }
  }
}

const money = (v) => Math.round(parseFloat(v || 0) * 100) / 100
const formatCurrency = (v) =>
  new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(money(v)) + ' ETB'

onMounted(loadMyBeneficiaries)
</script>

<style scoped>
/* ─── Overlay ─────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 760px;
  max-height: 90vh; overflow-y: auto;
  display: flex; flex-direction: column;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: white; z-index: 1;
}
.modal-header h3 { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }
.close-btn {
  background: none; border: none; font-size: 22px; cursor: pointer;
  color: #94a3b8; line-height: 1; padding: 4px;
}
.close-btn:hover { color: #334155; }

/* ─── Sections ───────────────────────────────────────────────────────────── */
.section {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.section:last-of-type { border-bottom: none; }
.section-title {
  font-size: 15px; font-weight: 600; color: #1e293b;
  margin: 0 0 14px;
  display: flex; align-items: baseline; gap: 8px;
}
.section-subtitle { font-size: 12px; font-weight: 400; color: #94a3b8; }

/* ─── Form elements ──────────────────────────────────────────────────────── */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
label { font-size: 13px; font-weight: 500; color: #334155; }
.req { color: #ef4444; }
input, select {
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; color: #0f172a; transition: border-color .15s;
}
input:focus, select:focus { outline: none; border-color: #7c3aed; }
.hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* ─── Computed boxes ─────────────────────────────────────────────────────── */
.computed-box {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 14px; display: flex; flex-direction: column; gap: 3px;
  width: 100%;
}
.computed-label { font-size: 11px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; }
.computed-value { font-size: 16px; font-weight: 600; color: #7c3aed; }

.totals-bar {
  display: flex; align-items: center; justify-content: space-between;
  background: #f8f5ff; border: 1px solid #ddd6fe; border-radius: 8px;
  padding: 8px 14px; margin-bottom: 14px; font-size: 14px;
}
.total-label { color: #6d28d9; font-weight: 500; }
.total-value  { color: #4c1d95; font-weight: 700; font-size: 16px; }

/* ─── Recurring ──────────────────────────────────────────────────────────── */
.recurring-row { margin-bottom: 12px; }
.toggle-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #334155; cursor: pointer;
}
.custom-checkbox { position: relative; width: 18px; height: 18px; flex-shrink: 0; }
.custom-checkbox input {
  position: absolute; opacity: 0; width: 100%; height: 100%;
  margin: 0; cursor: pointer; z-index: 1;
  border: none; padding: 0;
}
.custom-checkbox .checkmark {
  position: absolute; inset: 0;
  border: 2px solid #cbd5e1; border-radius: 4px; background: white;
  transition: all .15s;
}
.custom-checkbox input:checked ~ .checkmark {
  background: #7c3aed; border-color: #7c3aed;
}
.custom-checkbox .checkmark::after {
  content: ''; position: absolute;
  top: 2px; left: 5px; width: 5px; height: 9px;
  border: solid white; border-width: 0 2px 2px 0;
  transform: rotate(45deg); opacity: 0;
}
.custom-checkbox input:checked ~ .checkmark::after { opacity: 1; }

.interval-totals {
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
  padding: 10px 14px; margin-top: 12px;
}
.itotal-row {
  display: flex; justify-content: space-between; font-size: 13px;
  color: #166534; padding: 2px 0;
}

/* ─── Loading / empty states ─────────────────────────────────────────────── */
.loading-bens {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: #94a3b8; padding: 20px 0;
}
.mini-spinner {
  width: 18px; height: 18px;
  border: 2px solid #e2e8f0; border-top-color: #7c3aed;
  border-radius: 50%; animation: spin .6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.no-bens {
  background: #fef9c3; border: 1px solid #fde047; border-radius: 8px;
  padding: 14px 16px; font-size: 13px; color: #713f12;
}

/* ─── Beneficiary table ──────────────────────────────────────────────────── */
.ben-table-header {
  display: grid;
  grid-template-columns: 2fr 100px 140px 120px;
  gap: 8px;
  padding: 6px 10px;
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: .04em;
  border-bottom: 1px solid #f1f5f9; margin-bottom: 6px;
}
.ben-row {
  display: grid;
  grid-template-columns: 2fr 100px 140px 120px;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all .15s;
  margin-bottom: 4px;
}
.ben-row:hover { background: #fafafa; }
.ben-row.has-value { background: #f8f5ff; border-color: #e9d5ff; }

.col-name { display: flex; align-items: center; gap: 8px; overflow: hidden; }
.ben-avatar {
  width: 30px; height: 30px; min-width: 30px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: white; font-size: 13px; font-weight: 700;
}
.ben-name { font-size: 13px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.col-type { display: flex; align-items: center; }
.type-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.type-badge.individual   { background: #e0f2fe; color: #0369a1; }
.type-badge.organization { background: #f3e8ff; color: #6d28d9; }

.col-amount, .col-qty { display: flex; align-items: center; }
.col-value  { display: flex; align-items: center; }
.col-method { display: flex; align-items: center; }

.amount-input, .qty-input {
  width: 100%; padding: 6px 10px;
  border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px;
}
.amount-input:focus, .qty-input:focus { outline: none; border-color: #7c3aed; }

.method-select {
  width: 100%; padding: 6px 10px;
  border: 1px solid #e2e8f0; border-radius: 7px; font-size: 13px;
}

.calc-value { font-size: 13px; color: #94a3b8; font-weight: 500; }
.calc-value.calc-positive { color: #16a34a; font-weight: 600; }

.ben-table-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 10px 4px;
  font-size: 13px; color: #64748b;
  border-top: 1px solid #f1f5f9; margin-top: 8px;
}
.ben-table-footer strong { color: #4c1d95; font-size: 15px; }

/* ─── Progress ───────────────────────────────────────────────────────────── */
.progress-section { padding: 14px 24px; }
.progress-bar-wrap {
  height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px;
}
.progress-bar {
  height: 100%; background: linear-gradient(90deg, #6a11cb, #7c3aed);
  transition: width .3s ease; border-radius: 10px;
}
.progress-text { font-size: 13px; color: #7c3aed; font-weight: 500; text-align: center; }

/* ─── Errors ─────────────────────────────────────────────────────────────── */
.error-list { padding: 0 24px 12px; }
.error-item { font-size: 13px; color: #dc2626; margin-bottom: 4px; }

/* ─── Actions ────────────────────────────────────────────────────────────── */
.modal-actions {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  position: sticky; bottom: 0; background: white;
}
.btn-outline {
  background: white; border: 1px solid #e2e8f0; color: #475569;
  padding: 9px 20px; border-radius: 9px; font-size: 14px; cursor: pointer;
  transition: all .15s;
}
.btn-outline:hover:not(:disabled) { background: #f8fafc; }
.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white; border: none; padding: 9px 20px;
  border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: opacity .15s;
}
.btn-primary:disabled { opacity: .55; cursor: not-allowed; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .ben-table-header,
  .ben-row { grid-template-columns: 1fr 80px 110px; }
  .col-method { display: none; }
}
</style>