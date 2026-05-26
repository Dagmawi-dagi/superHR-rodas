<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">{{ isResubmitting ? 'Edit & Resubmit' : 'Request Adjustment' }}</h3>
        <div class="header-right">
          <span v-if="hasPendingAdjustment && !isResubmitting" class="status-badge pending">UNDER ADJUSTMENT</span>
          <span v-if="isResubmitting" class="status-badge commented">CLARIFICATION</span>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
      </div>

      <!-- Target info summary -->
      <div class="target-info">
        <div class="info-row">
          <span class="label">Beneficiary:</span>
          <span class="value">{{ beneficiaryName }}</span>
        </div>
        <div class="info-row" v-if="recurring">
          <span class="label">Period:</span>
          <span class="value">
            {{ item?.isRecurring?.recurring_type }} #{{ recurring.recurring_id }}
          </span>
        </div>
        <div class="info-row">
          <span class="label">Type:</span>
          <span class="value" style="text-transform: capitalize">{{ itemType }}</span>
        </div>
        <div class="info-row">
          <span class="label">Current {{ itemType === 'money' ? 'Value' : 'Quantity' }}:</span>
          <span class="value highlight">
            {{ itemType === 'money' ? formatCurrency(currentValue) : currentValue }}
            <span v-if="itemType !== 'money'" style="font-size:11px;font-weight:normal;color:#94a3b8;margin-left:4px">units</span>
          </span>
        </div>
        <!-- Blocked: already has pending adjustment -->
        <div v-if="hasPendingAdjustment && !isResubmitting" class="pending-warning">
          ⚠️ A pending adjustment request already exists for this specific target.
          Wait for admin review before submitting another.
        </div>
      </div>

      <form @submit.prevent="handlePrimaryAction" class="modal-form">
        <template v-if="!isConfirming">

          <!-- Action type selector -->
          <div class="form-group">
            <label>Adjustment Type <span class="req">*</span></label>
            <div class="type-grid">
              <button
                v-for="t in types" :key="t.id"
                type="button"
                class="type-btn"
                :class="[{ active: form.action === t.id }, t.cls]"
                @click="form.action = t.id"
                :disabled="hasPendingAdjustment && !isResubmitting"
              >
                {{ t.label }}
              </button>
            </div>
          </div>

          <!-- Amount / Quantity -->
          <div class="form-row">
            <div class="form-group">
              <label>{{ itemType === 'money' ? 'Value (ETB)' : 'Quantity' }} <span class="req">*</span></label>
              <input
                v-model.number="form.amount"
                type="number" step="0.01" min="0.01"
                :max="['Deduct', 'Return', 'Transfer'].includes(form.action) ? currentValue : undefined"
                :disabled="form.action === 'Return' || (hasPendingAdjustment && !isResubmitting)"
                required
                :placeholder="itemType === 'money' ? '0.00' : '0'"
              />
              <small class="hint" v-if="itemType !== 'money'">Number of units to {{ form.action?.toLowerCase() }}</small>
            </div>

            <!-- Transfer → pick target beneficiary -->
            <div class="form-group" v-if="form.action === 'Transfer'">
              <label>Transfer To <span class="req">*</span></label>
              <select v-model="form.toBeneficiaryId" required :disabled="hasPendingAdjustment && !isResubmitting">
                <option value="">Select recipient</option>
                <option
                  v-for="ben in otherBeneficiaries"
                  :key="ben.beneficiaryId"
                  :value="ben.beneficiaryId"
                >
                  {{ ben.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Reason -->
          <div class="form-group">
            <label>Reason for Request <span class="req">*</span></label>
            <textarea
              v-model="form.reason"
              rows="3" required
              :disabled="hasPendingAdjustment && !isResubmitting"
              placeholder="Explain why this adjustment is needed..."
            ></textarea>
          </div>

        </template>

        <!-- Confirmation view -->
        <div v-else class="confirm-view">
          <div class="confirm-banner">
            <h4 class="confirm-title">{{ isResubmitting ? 'Save changes and resubmit?' : 'Submit this adjustment request?' }}</h4>
          </div>
          <div class="confirm-summary">
            <p><strong>Action:</strong> {{ form.action }}</p>
            <p><strong>{{ itemType === 'money' ? 'Value' : 'Quantity' }}:</strong>
              {{ itemType === 'money' ? formatCurrency(form.amount) : form.amount + ' units' }}</p>
            <p v-if="form.action === 'Transfer'">
              <strong>Transfer To:</strong>
              {{ otherBeneficiaries.find(b => b.beneficiaryId === form.toBeneficiaryId)?.name }}
            </p>
            <p><strong>Reason:</strong> {{ form.reason }}</p>
            <p v-if="recurring"><strong>Period:</strong> {{ item?.isRecurring?.recurring_type }} #{{ recurring.recurring_id }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary"
            @click="isConfirming ? (isConfirming = false) : $emit('close')">
            {{ isConfirming ? 'Back' : 'Cancel' }}
          </button>
          <button type="submit" class="btn-primary"
            :disabled="submitting || !isValid || (hasPendingAdjustment && !isResubmitting)">
            {{ submitting ? 'Submitting...' : isConfirming ? (isResubmitting ? 'Yes, Resubmit' : 'Yes, Submit Request') : 'Next' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import CharityService from '@/stores/charity'

const props = defineProps({
  isOpen:        { type: Boolean, default: false },
  item:          { type: Object,  default: null },   // CharityDonationItem
  recurring:     { type: Object,  default: null },   // one entry from isRecurring.recurrings[]
  beneficiaries: { type: Array,   default: () => [] }, // all beneficiaries in the team (for Transfer)
  requestToEdit: { type: Object,  default: null }    // Existing request if resubmitting
})

const emit = defineEmits(['close', 'success'])

const submitting   = ref(false)
const isConfirming = ref(false)

const isResubmitting = computed(() => !!props.requestToEdit)

const form = reactive({
  action:          'Deduct',
  amount:          null,
  reason:          '',
  toBeneficiaryId: ''
})

// Reset whenever the modal opens
watch(() => props.isOpen, (val) => {
  if (val) {
    isConfirming.value   = false
    if (props.requestToEdit) {
      form.action = props.requestToEdit.action
      form.amount = parseFloat(props.requestToEdit.metadata?.amount || 0)
      form.reason = props.requestToEdit.metadata?.reason || ''
      form.toBeneficiaryId = props.requestToEdit.metadata?.toBeneficiaryId || ''
    } else {
      form.action          = 'Deduct'
      form.amount          = null
      form.reason          = ''
      form.toBeneficiaryId = ''
    }
  }
})

// Auto-fill amount when switching to Return
watch(() => form.action, (a) => {
  if (a === 'Return') form.amount = currentValue.value
})

// ── Action types (match backend ENUM exactly) ─────────────────────────────────
const types = [
  { id: 'Deduct',   label: 'Deduct',   cls: 'deduct'   },
  { id: 'Increase', label: 'Increase', cls: 'increase' },
  { id: 'Transfer', label: 'Transfer', cls: 'transfer' },
  { id: 'Return',   label: 'Return',   cls: 'return'   },
]

// ── Computed helpers ──────────────────────────────────────────────────────────

const hasPendingAdjustment = computed(() => {
  if (!props.item?.onAdjustment) return false
  const adjs = Array.isArray(props.item.onAdjustment) ? props.item.onAdjustment : [props.item.onAdjustment]
  return adjs.some(a => 
    ['pending', 'commented'].includes(a.status) && 
    (props.recurring ? a.recurring_id === props.recurring.recurring_id : a.recurring_id === null)
  )
})

const beneficiaryName = computed(() => {
  if (!props.item) return 'Beneficiary'
  return props.item.beneficiary?.name || props.item.Beneficiary?.name || 'Beneficiary'
})

const itemType = computed(() => props.item?.type || 'money')

// Value to display + use as max for Deduct/Return/Transfer
const currentValue = computed(() => {
  if (!props.item) return 0
  if (props.recurring) {
    // Recurring period — use the recurring's own values (snake_case from JSONB)
    return itemType.value === 'money'
      ? parseFloat(props.recurring.total_value_in_birr || 0)
      : parseFloat(props.recurring.quantity || 0)
  }
  // One-time item — use top-level fields
  return itemType.value === 'money'
    ? parseFloat(props.item.totalValueInBirr || 0)
    : parseFloat(props.item.quantity || 0)
})

const otherBeneficiaries = computed(() => {
  if (!props.item) return props.beneficiaries
  return props.beneficiaries.filter(b => b.beneficiaryId !== props.item.beneficiaryId)
})

const isValid = computed(() => {
  if (!props.item || !form.action || !form.reason?.trim()) return false
  if (form.amount === null || form.amount <= 0)             return false
  if (form.action === 'Transfer' && !form.toBeneficiaryId)  return false
  if (['Deduct', 'Return', 'Transfer'].includes(form.action) && form.amount > currentValue.value) return false
  return true
})

// ── Submit ────────────────────────────────────────────────────────────────────

const handlePrimaryAction = () => {
  if (!isValid.value) return
  if (!isConfirming.value) {
    isConfirming.value = true
  } else {
    handleSubmit()
  }
}

const handleSubmit = async () => {
  if (!isValid.value || !props.item) return
  submitting.value = true

  const metadata = {
    amount:           form.amount,
    ...(form.action === 'Transfer' && { toBeneficiaryId: form.toBeneficiaryId }),
  }

  let res
  if (isResubmitting.value) {
    res = await CharityService.resubmitRequest(props.requestToEdit.requestId, {
      action: form.action,
      reason: form.reason,
      metadata
    })
  } else {
    res = await CharityService.submitAdjustment({
      action:          form.action,
      donationItemId:  props.item.donationItemId,
      recurringId:     props.recurring?.recurring_id ?? null,
      reason:          form.reason,
      metadata
    })
  }

  submitting.value = false

  if (res.success) {
    emit('success', res.message || (isResubmitting.value ? 'Adjustment resubmitted' : 'Adjustment request submitted'))
    emit('close')
    isConfirming.value = false
  } else {
    alert(res.error || 'Operation failed')
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

const formatCurrency = (v) =>
  new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v || 0)
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1100;
}
.modal-box {
  background: white; border-radius: 16px; width: 100%; max-width: 500px; padding: 24px;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}
.modal-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.header-right { display: flex; align-items: center; gap: 12px; }
.status-badge { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 20px; letter-spacing: 0.5px; }
.status-badge.pending { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status-badge.commented { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.target-info {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;
}
.info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.info-row:last-child { margin-bottom: 0; }
.label { color: #64748b; }
.value { color: #1e293b; font-weight: 600; }
.highlight { color: #7c3aed; font-size: 15px; }

.pending-warning {
  margin-top: 10px; padding: 8px 12px; background: #fef3c7;
  border: 1px solid #f59e0b; border-radius: 8px;
  font-size: 12px; color: #92400e; line-height: 1.5;
}

.type-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px;
}
.type-btn {
  padding: 8px 4px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 11px; font-weight: 600; background: white; color: #64748b;
  cursor: pointer; transition: all 0.2s;
}
.type-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.type-btn.active.deduct   { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
.type-btn.active.increase { background: #dcfce7; border-color: #22c55e; color: #15803d; }
.type-btn.active.transfer { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
.type-btn.active.return   { background: #e0f2fe; border-color: #0ea5e9; color: #0369a1; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }
input, select, textarea {
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; width: 100%;
  box-sizing: border-box;
}
input:disabled, select:disabled, textarea:disabled { background: #f8fafc; color: #94a3b8; }
.hint { font-size: 11px; color: #94a3b8; }

.confirm-view { margin-bottom: 16px; }
.confirm-banner { margin-bottom: 12px; }
.confirm-title { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.confirm-summary p { font-size: 13px; color: #475569; margin: 4px 0; }

.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
.btn-primary {
  background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  background: #f1f5f9; color: #475569; border: none; padding: 10px 24px;
  border-radius: 10px; font-weight: 600; cursor: pointer;
}
</style>