<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">Request Adjustment</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="target-info">
        <div class="info-row">
          <span class="label">Beneficiary:</span>
          <span class="value">{{ beneficiaryName }}</span>
        </div>
        <div class="info-row" v-if="interval">
          <span class="label">Period:</span>
          <span class="value">{{ interval.intervalType }} #{{ interval.intervalCount }} ({{ formatDate(interval.startDate) }})</span>
        </div>
        <div class="info-row">
          <span class="label">Current Value:</span>
          <span class="value highlight">{{ formatCurrency(currentValue) }}</span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label>Adjustment Type <span class="req">*</span></label>
          <div class="type-grid">
            <button 
              v-for="t in types" :key="t.id"
              type="button"
              class="type-btn"
              :class="[{ active: form.type === t.id }, t.id]"
              @click="form.type = t.id"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Amount / Quantity <span class="req">*</span></label>
            <input 
              v-model.number="form.amount" 
              type="number" 
              step="0.01" 
              min="0.01" 
              :max="['deduct', 'return', 'reassign'].includes(form.type) ? currentValue : undefined"
              required 
              placeholder="0.00"
            />
            <small class="hint" v-if="itemType !== 'money'">Enter units for goods/service</small>
          </div>

          <div class="form-group" v-if="form.type === 'reassign'">
            <label>Transfer To <span class="req">*</span></label>
            <select v-model="form.toBeneficiaryId" required>
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

        <div class="form-group">
          <label>Reason for Request <span class="req">*</span></label>
          <textarea 
            v-model="form.reason" 
            rows="3" 
            required 
            placeholder="Explain why this adjustment is needed..."
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="submitting || !isValid">
            {{ submitting ? 'Submitting...' : 'Submit Request' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import charityService from '@/stores/charity'

const props = defineProps({
  isOpen: Boolean,
  item: { type: Object, required: true },
  interval: { type: Object, default: null },
  beneficiaries: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'success'])

const submitting = ref(false)

const form = reactive({
  type: 'deduct',
  amount: null,
  reason: '',
  toBeneficiaryId: ''
})

const types = [
  { id: 'deduct',   label: 'Deduct' },
  { id: 'increase', label: 'Increase' },
  { id: 'reassign', label: 'Reassign' },
  { id: 'return',   label: 'Return' },
]

const beneficiaryName = computed(() => {
  return props.item.beneficiary?.name || 'Beneficiary'
})

const itemType = computed(() => props.item.type)

const currentValue = computed(() => {
  if (props.interval) return parseFloat(props.interval.value)
  return parseFloat(props.item.totalValue)
})

const otherBeneficiaries = computed(() => {
  return props.beneficiaries.filter(b => b.beneficiaryId !== props.item.beneficiaryId)
})

const isValid = computed(() => {
  if (!form.type || !form.amount || !form.reason) return false
  if (form.type === 'reassign' && !form.toBeneficiaryId) return false
  if (['deduct', 'return', 'reassign'].includes(form.type) && form.amount > currentValue.value) return false
  return true
})

const handleSubmit = async () => {
  if (!isValid.value) return
  submitting.value = true
  
  const payload = {
    type: form.type,
    amount: form.amount,
    reason: form.reason,
    toBeneficiaryId: form.type === 'reassign' ? form.toBeneficiaryId : undefined,
    intervalId: props.interval?.intervalId
  }

  const res = await charityService.requestAdjustment(props.item.donationItemId, payload)
  submitting.value = false
  
  if (res.success) {
    emit('success', res.message)
    emit('close')
    // Reset form
    form.amount = null
    form.reason = ''
    form.toBeneficiaryId = ''
  } else {
    alert(res.error || 'Failed to submit request')
  }
}

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}-${date.getDate()}`
}

const formatCurrency = (v) => new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(v || 0)
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
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }

.target-info {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;
}
.info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.info-row:last-child { margin-bottom: 0; }
.label { color: #64748b; }
.value { color: #1e293b; font-weight: 600; }
.highlight { color: #7c3aed; font-size: 15px; }

.type-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px;
}
.type-btn {
  padding: 8px 4px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; font-weight: 600;
  background: white; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.type-btn.active.deduct { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
.type-btn.active.increase { background: #dcfce7; border-color: #22c55e; color: #15803d; }
.type-btn.active.reassign { background: #fef3c7; border-color: #f59e0b; color: #b45309; }
.type-btn.active.return { background: #e0f2fe; border-color: #0ea5e9; color: #0369a1; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }
input, select, textarea {
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; width: 100%;
}
.hint { font-size: 11px; color: #94a3b8; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;
}
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
