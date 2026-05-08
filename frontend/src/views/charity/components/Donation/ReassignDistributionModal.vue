<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Reassign / Deduct Distribution</h3>
        <button @click="close" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <div class="info-box">
          <p><strong>Item:</strong> {{ item?.description || 'Item' }}</p>
          <p><strong>From:</strong> {{ distribution?.Beneficiary?.name }}</p>
          <p>
            <strong>Current {{ item?.type === 'money' ? 'Amount' : 'Quantity' }}:</strong> 
            {{ item?.type === 'money' ? formatCurrency(distribution?.value) : distribution?.quantity }}
          </p>
        </div>

        <div class="form-group">
          <label>Amount to {{ reassign ? 'Reassign' : 'Deduct' }} ({{ item?.type === 'money' ? 'Value' : 'Quantity' }})</label>
          <input 
            type="number" 
            v-model.number="form.amount" 
            :max="item?.type === 'money' ? distribution?.value : distribution?.quantity" 
            min="0.01"
            step="0.01"
          />
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="reassign" /> 
            Reassign to another beneficiary?
          </label>
        </div>

        <div v-if="reassign" class="form-group">
          <label>Target Beneficiary</label>
          <select v-model="form.toBeneficiaryId">
            <option :value="undefined">Select Beneficiary</option>
            <option 
              v-for="ben in filteredBeneficiaries" 
              :key="ben.beneficiaryId" 
              :value="ben.beneficiaryId"
              :disabled="ben.beneficiaryId === distribution?.beneficiaryId"
            >
              {{ ben.name }} ({{ ben.type }})
            </option>
          </select>
          <p v-if="filteredBeneficiaries.length < beneficiaries.length" class="hint-text">
            * Some beneficiaries are hidden because they already returned this item.
          </p>
        </div>

        <div class="form-group">
          <label>Reason</label>
          <textarea v-model="form.reason" placeholder="Why is this being reassigned/deducted?"></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button 
          class="btn-primary" 
          @click="submit" 
          :disabled="loading || !form.amount || !form.reason || (reassign && !form.toBeneficiaryId)"
        >
          {{ loading ? 'Processing...' : 'Submit' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import CharityService, { type DonationItem, type DonationDistribution, type Beneficiary } from '@/stores/charity'

const props = defineProps<{
  isOpen: boolean
  distribution: DonationDistribution | null
  item: DonationItem | null
}>()

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const reassign = ref(false)
const beneficiaries = ref<Beneficiary[]>([])

const formatCurrency = (v: any) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(v) : '0.00'

const filteredBeneficiaries = computed(() => {
  if (!props.item || !props.item.DonationDistributions) return beneficiaries.value
  
  // Get IDs of beneficiaries who already returned this item/interval
  const returnedBenIds = props.item.DonationDistributions
    .filter(d => d.isReturned && String(d.intervalId) === String(props.distribution?.intervalId))
    .map(d => d.beneficiaryId)
    
  return beneficiaries.value.filter(ben => !returnedBenIds.includes(ben.beneficiaryId))
})

const form = reactive({
  amount: 0,
  toBeneficiaryId: undefined as number | undefined,
  reason: ''
})

watch(() => props.isOpen, async (val) => {
  if (val && props.distribution) {
    // For money items, we show/edit the 'value' (amount), for others 'quantity'
    form.amount = props.item?.type === 'money' 
      ? Number(props.distribution.value) 
      : Number(props.distribution.quantity)
      
    form.reason = ''
    form.toBeneficiaryId = undefined
    reassign.value = false
    
    // Load beneficiaries if not loaded
    if (beneficiaries.value.length === 0) {
      const res = await CharityService.getBeneficiaries({ size: 1000 })
      if (res.success) {
        beneficiaries.value = res.data
      }
    }
  }
})

const close = () => {
  emit('close')
}

const submit = async () => {
  if (!props.distribution || !props.item) return
  
  loading.value = true
  try {
    // If it's a money item, we need to convert the amount (value) back to quantity fraction
    // because the backend's reassignDistribution expects 'amount' to be relative to 'quantity'
    let finalAmount = form.amount
    if (props.item.type === 'money') {
      finalAmount = form.amount / (Number(props.item.unitValue) || 1)
    }

    const res = await CharityService.reassignDistribution(props.distribution.distributionId, {
      amount: finalAmount,
      toBeneficiaryId: reassign.value ? form.toBeneficiaryId : undefined,
      reason: form.reason
    })
    
    if (res.success) {
      emit('success')
      close()
    } else {
      alert(res.error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
}
.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
.info-box {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
}
.info-box p {
  margin: 4px 0;
  font-size: 0.95rem;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #444;
}
.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.form-group input[type="number"],
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}
.form-group textarea {
  height: 80px;
  resize: vertical;
}
.hint-text {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: 4px;
  font-style: italic;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
.btn-secondary {
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
</style>
