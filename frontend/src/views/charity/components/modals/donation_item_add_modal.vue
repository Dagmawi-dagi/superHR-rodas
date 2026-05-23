<template>
  <div class="modal-overlay">
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
                <span class="computed-label">Total Allocated Value</span>
                <span class="computed-value">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Recurring Toggle -->
          <div class="recurring-row">
            <label class="toggle-label">
              <span class="custom-checkbox">
                <input type="checkbox" v-model="form.isRecurring" />
                <span class="checkmark"></span>
              </span>
              Recurring payment
            </label>
            <small class="hint" v-if="form.isRecurring">Configure recurring schedules for each beneficiary below.</small>
          </div>
        </div>

        <!-- ═══════════════ BENEFICIARY ENTRIES ═══════════════ -->
        <div class="section">
          <h4 class="section-title">
            Beneficiaries
            <span class="section-subtitle">
              {{ form.isRecurring ? 'Configure individual schedules' : 'Enter values for each beneficiary' }}
            </span>
          </h4>

          <div v-if="loadingBens" class="loading-bens">
            <div class="mini-spinner"></div>
            Loading beneficiaries...
          </div>

          <div v-else-if="myBeneficiaries.length === 0" class="no-bens">
            <p>No beneficiaries found. Ask your admin to assign some to your group.</p>
          </div>

          <template v-else>
            <!-- HEADER -->
            <div class="ben-table-header" :class="{ 'recurring-header': form.isRecurring }">
              <span class="col-name">Beneficiary</span>
              <template v-if="form.isRecurring">
                <span class="col-recurring">Recurring</span>
                <span class="col-count">Periods</span>
                <span class="col-start">Start Date</span>
                <span class="col-end">End Date</span>
              </template>
              <template v-else>
                <span class="col-type">Type</span>
                <span class="col-amount" v-if="form.type === 'money'">Value (ETB)</span>
                <span class="col-method" v-if="form.type === 'money'">Method</span>
                <span class="col-qty" v-if="form.type !== 'money'">Quantity</span>
                <span class="col-value" v-if="form.type !== 'money'">Total Value</span>
              </template>
            </div>

            <!-- ROWS -->
            <div
              v-for="row in rows"
              :key="row.beneficiaryId"
              class="ben-row-wrapper"
              :class="{ 'has-value': rowHasValue(row) }"
            >
              <div class="ben-row-main" :class="{ 'recurring-grid': form.isRecurring }">
                <div class="col-name">
                  <div class="ben-avatar">{{ row.name.charAt(0) }}</div>
                  <span class="ben-name">{{ row.name }}</span>
                </div>

                <template v-if="form.isRecurring">
                  <div class="col-recurring">
                    <select v-model="row.recurringType" @change="updateRowRecurrings(row)">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div class="col-count">
                    <input type="number" min="0" v-model.number="row.recurringCount" placeholder="0" @input="updateRowRecurrings(row)" />
                  </div>
                  <div class="col-start">
                    <input type="date" v-model="row.recurringStartDate" @change="updateRowRecurrings(row)" />
                  </div>
                  <div class="col-end">
                    <span class="end-hint">{{ computeRowEndDate(row) || '—' }}</span>
                  </div>
                </template>

                <template v-else>
                  <div class="col-type">
                    <span class="type-badge" :class="row.benType">{{ row.benType }}</span>
                  </div>
                  <template v-if="form.type === 'money'">
                    <div class="col-amount">
                      <input type="number" step="0.01" min="0" v-model.number="row.amount" placeholder="0.00" />
                    </div>
                    <div class="col-method">
                      <select v-model="row.paymentMethod">
                        <option value="bank">Bank</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>
                  </template>
                  <template v-else>
                    <div class="col-qty">
                      <input type="number" step="0.01" min="0" v-model.number="row.quantity" placeholder="0" />
                    </div>
                    <div class="col-value">
                      <span class="calc-text" :class="{ 'positive': rowValue(row) > 0 }">
                        {{ form.unitValue > 0 ? formatCurrency(rowValue(row)) : '—' }}
                      </span>
                    </div>
                  </template>
                </template>
              </div>

              <!-- MINI TABLE FOR RECURRING -->
              <div class="recurring-details" v-if="form.isRecurring && row.recurringCount > 0">
                <div class="details-header" :class="{ 'goods-header': form.type !== 'money' }">
                  <span>#</span>
                  <span>Due Date</span>
                  <span>{{ form.type === 'money' ? 'Value (ETB)' : 'Quantity' }}</span>
                  <span v-if="form.type === 'money'">Method</span>
                  <span v-if="form.type === 'money'">Pay Date</span>
                  <span v-if="form.type !== 'money'">Total Value</span>
                </div>
                <div v-for="(rec, idx) in row.recurrings" :key="idx" class="details-row" :class="{ 'goods-row': form.type !== 'money' }">
                  <span class="idx-box">{{ idx + 1 }}</span>
                  <span class="date-box">{{ formatDate(rec.startDate) }}</span>
                  
                  <input
                    v-if="form.type === 'money'"
                    type="number" step="0.01"
                    v-model.number="rec.value"
                    class="mini-input"
                  />
                  <input
                    v-else
                    type="number" step="0.01"
                    v-model.number="rec.quantity"
                    class="mini-input"
                  />

                  <select v-if="form.type === 'money'" v-model="rec.paymentMethod" class="mini-select">
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                  <input v-if="form.type === 'money'" type="date" v-model="rec.paymentDate" class="mini-input-date" />

                  <span v-if="form.type !== 'money'" class="mini-calc-val">
                    {{ formatCurrency((rec.quantity || 0) * (form.unitValue || 0)) }}
                  </span>
                </div>
                <div class="details-footer">
                   <span>Total for this beneficiary:</span>
                   <strong>{{ formatCurrency(rowValue(row)) }}</strong>
                </div>
              </div>
            </div>

            <!-- Footer Summary -->
            <div class="ben-table-footer" v-if="filledRows.length > 0">
              <span>{{ filledRows.length }} beneficiaries configured</span>
              <strong>Grand Total: {{ formatCurrency(grandTotal) }}</strong>
            </div>
          </template>
        </div>

        <div class="progress-section" v-if="submitProgress.active">
          <div class="progress-bar-wrap"><div class="progress-bar" :style="{ width: progressPercent + '%' }"></div></div>
          <p class="progress-text">Saving {{ submitProgress.done }} of {{ submitProgress.total }}...</p>
        </div>

        <div class="error-list" v-if="formErrors.length">
          <p v-for="err in formErrors" :key="err" class="error-item">⚠ {{ err }}</p>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-outline" :disabled="submitProgress.active">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="!canSubmit || submitProgress.active">
            {{ submitProgress.active ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Items' }}
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

const loadingBens = ref(false)
const myBeneficiaries = ref([])
const rows = ref([])
const form = reactive({
  type: 'money',
  description: '',
  unitValue: 0,
  isRecurring: false,
})
const submitProgress = reactive({ active: false, done: 0, total: 0 })

const loadMyBeneficiaries = async () => {
  loadingBens.value = true
  try {
    let bens = []
    const grpRes = await CharityService.getCallerTeam(authStore.user.userId) // Adjust if needed
    if (grpRes.success && grpRes.data) {
       // ... logic to get beneficiaries ...
    }
    // For now assuming team beneficiaries are loaded
    myBeneficiaries.value = bens
    rows.value = bens.map(b => ({
      beneficiaryId: b.beneficiaryId,
      name: b.name,
      benType: b.type,
      amount: null,
      paymentMethod: 'bank',
      quantity: null,
      recurringType: 'monthly',
      recurringCount: 0,
      recurringStartDate: '',
      recurrings: []
    }))

    if (isEdit.value && props.itemToEdit) {
      const r = rows.value.find(row => row.beneficiaryId === props.itemToEdit.beneficiaryId)
      if (r) {
        form.type = props.itemToEdit.type
        form.description = props.itemToEdit.description
        form.unitValue = parseFloat(props.itemToEdit.unitValueInBirr)
        form.isRecurring = !!props.itemToEdit.isRecurring
        
        if (form.isRecurring) {
          const recData = props.itemToEdit.isRecurring.recurrings || []
          r.recurringType = props.itemToEdit.isRecurring.recurring_type
          r.recurringCount = props.itemToEdit.isRecurring.recurring_count
          r.recurringStartDate = props.itemToEdit.isRecurring.start_date || ''
          r.recurrings = recData.map(rec => ({
            recurring_id: rec.recurring_id,
            startDate: rec.startDate || '',
            endDate: rec.endDate || '',
            value: parseFloat(rec.total_value_in_birr),
            quantity: parseFloat(rec.quantity),
            paymentMethod: rec.payment_method,
            paymentDate: rec.paymentDate || ''
          }))
        } else {
          r.amount = parseFloat(props.itemToEdit.unitValueInBirr)
          r.quantity = parseFloat(props.itemToEdit.quantity)
          r.paymentMethod = props.itemToEdit.paymentMethod
        }
      }
    }
  } finally {
    loadingBens.value = false
  }
}

const rowHasValue = (row) => {
  if (form.isRecurring) return row.recurringCount > 0
  return form.type === 'money' ? row.amount > 0 : row.quantity > 0
}

const rowValue = (row) => {
  if (form.isRecurring) {
    if (form.type === 'money') {
      return row.recurrings.reduce((s, i) => s + (parseFloat(i.value) || 0), 0)
    } else {
      return row.recurrings.reduce((s, i) => s + ((parseFloat(i.quantity) || 0) * (parseFloat(form.unitValue) || 0)), 0)
    }
  }
  if (form.type === 'money') return parseFloat(row.amount) || 0
  return (parseFloat(row.quantity) || 0) * (parseFloat(form.unitValue) || 0)
}

const filledRows = computed(() => rows.value.filter(rowHasValue))
const grandTotal = computed(() => rows.value.reduce((s, r) => s + rowValue(r), 0))
const progressPercent = computed(() => (submitProgress.done / (submitProgress.total || 1)) * 100)

const computeRowEndDate = (row) => {
  if (!row.recurringStartDate || !row.recurringCount) return ''
  const d = new Date(row.recurringStartDate)
  if (row.recurringType === 'daily') d.setDate(d.getDate() + row.recurringCount - 1)
  else if (row.recurringType === 'weekly') d.setDate(d.getDate() + row.recurringCount * 7 - 1)
  else if (row.recurringType === 'monthly') d.setMonth(d.getMonth() + row.recurringCount)
  return d.toISOString().split('T')[0]
}

const updateRowRecurrings = (row) => {
  if (!form.isRecurring || !row.recurringStartDate || !row.recurringCount) {
    row.recurrings = []
    return
  }
  const newRecs = []
  const perPeriodQty = parseFloat(row.quantity) || 0
  const uv = parseFloat(form.unitValue) || 0
  const perPeriodValue = form.type === 'money' ? (parseFloat(row.amount) || 0) : (perPeriodQty * uv)
  
  for (let i = 0; i < row.recurringCount; i++) {
    let s = new Date(row.recurringStartDate); let e = new Date(row.recurringStartDate)
    if (row.recurringType === 'daily') { s.setDate(s.getDate() + i); e.setDate(e.getDate() + i) }
    else if (row.recurringType === 'weekly') { s.setDate(s.setDate() + i*7); e.setDate(e.getDate() + (i+1)*7-1) }
    else if (row.recurringType === 'monthly') { s.setMonth(s.getMonth() + i); e.setMonth(e.getMonth() + i+1); e.setDate(e.getDate()-1) }

    const old = row.recurrings[i]
    newRecs.push({
      recurring_id: i + 1,
      startDate: s.toISOString().split('T')[0],
      endDate: e.toISOString().split('T')[0],
      value: (old && old.value > 0 && form.type === 'money') ? old.value : perPeriodValue,
      quantity: (old && old.quantity > 0 && form.type !== 'money') ? old.quantity : perPeriodQty,
      paymentMethod: old ? old.paymentMethod : row.paymentMethod,
      paymentDate: old ? old.paymentDate : ''
    })
  }
  row.recurrings = newRecs
}

const formErrors = computed(() => {
  const errs = []
  if (!form.type) errs.push('Select item type')
  if (form.type !== 'money' && !(form.unitValue > 0)) errs.push('Unit Value required')
  if (filledRows.value.length === 0) errs.push('Configure at least one beneficiary')
  if (form.isRecurring) {
    filledRows.value.forEach(r => {
      if (!r.recurringStartDate) errs.push(`${r.name}: Start date required`)
      if (form.type === 'money') {
        if (r.recurrings.some(i => !(i.value > 0))) errs.push(`${r.name}: Value required for all periods`)
      } else {
        if (r.recurrings.some(i => !(i.quantity > 0))) errs.push(`${r.name}: Quantity required for all periods`)
      }
    })
  }
  return errs
})

const canSubmit = computed(() => formErrors.value.length === 0)

const handleSubmit = async () => {
  if (!canSubmit.value) return
  submitProgress.active = true; submitProgress.done = 0; submitProgress.total = filledRows.value.length
  const errors = []

  for (const row of filledRows.value) {
    const payload = buildPayload(row)
    let res
    if (isEdit.value && props.itemToEdit && row.beneficiaryId === props.itemToEdit.beneficiaryId) {
      res = await CharityService.updateDonationItem(props.itemToEdit.donationItemId, payload)
    } else {
      res = await CharityService.addDonationItem(props.donationId, payload)
    }
    if (!res.success) errors.push(`${row.name}: ${res.error}`)
    submitProgress.done++
  }
  submitProgress.active = false
  if (errors.length) alert('Failures:\n' + errors.join('\n'))
  emit('saved')
}

const buildPayload = (row) => {
  const recData = form.isRecurring ? {
    recurring_type: row.recurringType,
    recurring_count: row.recurringCount,
    start_date: row.recurringStartDate,
    recurrings: row.recurrings.map(i => ({
      recurring_id: i.recurring_id,
      quantity: form.type === 'money' ? 1 : i.quantity,
      unit_value_in_birr: form.type === 'money' ? i.value : form.unitValue,
      total_value_in_birr: form.type === 'money' ? i.value : (i.quantity * form.unitValue),
      payment_method: i.paymentMethod,
      is_delivered: false,
      is_returned: null
    }))
  } : null

  const base = {
    beneficiaryId: row.beneficiaryId,
    type: form.type,
    description: form.description,
    totalValueInBirr: rowValue(row)
  }

  if (form.type === 'money') {
    return { ...base, quantity: 1, unitValueInBirr: Math.round((parseFloat(row.amount)||0)*100)/100, paymentMethod: row.paymentMethod, isRecurring: recData }
  } else {
    const totalQty = form.isRecurring ? row.recurrings.reduce((s, i) => s + (parseFloat(i.quantity)||0), 0) : parseFloat(row.quantity)
    return { ...base, quantity: totalQty, unitValueInBirr: form.unitValue, isRecurring: recData }
  }
}

const formatCurrency = (v) => CharityService.formatCurrency(v)
const formatDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`
}

onMounted(loadMyBeneficiaries)
</script>

<style scoped>
/* Same styles as before, just updated some classes for naming consistency if needed */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal { background: white; border-radius: 16px; width: 100%; max-width: 1000px; max-height: 92vh; overflow-y: auto; display: flex; flex-direction: column; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 20; }
.section { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.section-title { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 16px; display: flex; align-items: baseline; gap: 8px; }
.section-subtitle { font-size: 12px; font-weight: 400; color: #94a3b8; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 13px; font-weight: 500; color: #475569; }
input, select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.req { color: #ef4444; }
.hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.computed-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; }
.computed-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
.computed-value { font-size: 18px; font-weight: 700; color: #7c3aed; }

.recurring-row { margin-top: 12px; padding: 12px; background: #fdfaff; border: 1px solid #ede9fe; border-radius: 10px; }
.toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #6d28d9; }

/* Beneficiary Table */
.ben-table-header { display: grid; grid-template-columns: 2fr 100px 120px 120px; gap: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
.recurring-header { grid-template-columns: 1.5fr 120px 80px 130px 120px; }

.ben-row-wrapper { border-radius: 12px; border: 1px solid transparent; margin-bottom: 8px; transition: all 0.2s; }
.ben-row-wrapper.has-value { background: #f8f5ff; border-color: #ddd6fe; }
.ben-row-main { display: grid; grid-template-columns: 2fr 100px 120px 120px; gap: 12px; align-items: center; padding: 10px; }
.recurring-grid { grid-template-columns: 1.5fr 120px 80px 130px 120px; }

.col-name { display: flex; align-items: center; gap: 10px; }
.ben-avatar { width: 32px; height: 32px; background: #7c3aed; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.ben-name { font-size: 14px; font-weight: 500; color: #1e293b; }

.type-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; text-transform: capitalize; font-weight: 600; }
.type-badge.individual { background: #e0f2fe; color: #0369a1; }
.type-badge.organization { background: #f3e8ff; color: #6d28d9; }

.ben-row-main input, .ben-row-main select { padding: 5px 8px; font-size: 13px; border-radius: 6px; width: 100%; }
.end-hint { font-size: 11px; color: #64748b; font-weight: 600; }

/* Recurring Details (Mini Table) */
.recurring-details { margin: 0 10px 10px 42px; background: white; border: 1px solid #ddd6fe; border-radius: 10px; padding: 12px; }
.details-header { display: grid; grid-template-columns: 30px 1fr 100px 100px 120px; gap: 10px; font-size: 10px; font-weight: 700; color: #7c3aed; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 6px; }
.details-header.goods-header { grid-template-columns: 30px 1fr 100px 120px; }
.details-row { display: grid; grid-template-columns: 30px 1fr 100px 100px 120px; gap: 10px; align-items: center; margin-bottom: 6px; }
.details-row.goods-row { grid-template-columns: 30px 1fr 100px 120px; }
.idx-box { font-size: 11px; font-weight: 700; color: #94a3b8; }
.date-box { font-size: 11px; color: #475569; }
.mini-input, .mini-select, .mini-input-date { padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11px; width: 100%; }
.mini-calc-val { font-size: 11px; color: #16a34a; font-weight: 600; text-align: right; }
.details-footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; font-size: 12px; }
.details-footer strong { color: #7c3aed; font-size: 14px; }

.ben-table-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 10px 10px; border-top: 2px dashed #f1f5f9; margin-top: 10px; }
.ben-table-footer strong { font-size: 18px; color: #4c1d95; }

.modal-actions { padding: 20px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; position: sticky; bottom: 0; background: white; z-index: 10; }
.btn-primary { background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-outline { background: white; border: 1px solid #e2e8f0; padding: 10px 24px; border-radius: 10px; color: #64748b; font-weight: 500; cursor: pointer; }

@keyframes spin { to { transform: rotate(360deg); } }
.mini-spinner { width: 18px; height: 18px; border: 2px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin .6s linear infinite; }
.loading-bens { display: flex; align-items: center; gap: 10px; padding: 30px; color: #94a3b8; justify-content: center; }
</style>
