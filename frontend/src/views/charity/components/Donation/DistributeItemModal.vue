<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" style="max-width: 700px">
      <h3>Distribute: {{ item?.description || 'Item' }}</h3>
      <div class="item-info">
        <span>Type: <strong>{{ typeLabel }}</strong></span>
        <span v-if="item.type === 'money'">
          Available: <strong>{{ formatCurrency(remaining) }}</strong>
        </span>
        <span v-else>
          Available: <strong>{{ remaining }} {{ unitLabel }}</strong>
        </span>
      </div>

      <!-- Beneficiary rows -->
      <div class="dist-rows">
        <div v-for="(row, index) in rows" :key="index" class="dist-row">
          <div class="field beneficiary">
            <label>Beneficiary</label>
            <select v-model="row.beneficiaryId">
              <option value="">Select</option>
              <option v-for="b in filteredBeneficiaries" :key="b.beneficiaryId" :value="b.beneficiaryId">
                {{ b.name }} ({{ b.type }})
              </option>
            </select>
          </div>
          <div class="field quantity" v-if="item.type !== 'money'">
            <label>Quantity</label>
            <input type="number" v-model.number="row.quantity" min="0" step="0.01" />
          </div>
          <div class="field value" v-else>
            <label>Amount</label>
            <input type="number" v-model.number="row.value" min="0" step="0.01" />
          </div>
          <div class="field computed" v-if="item.type !== 'money'">
            <label>Value</label>
            <input :value="row.quantity * item.unitValue" disabled />
          </div>
          <button class="remove-row" @click="removeRow(index)">×</button>
        </div>
      </div>

      <div class="add-row">
        <button @click="addRow" class="btn-secondary">+ Add Beneficiary</button>
        <span class="total-dist">
          Total: 
          <strong>
            {{ item.type === 'money' ? formatCurrency(totalDistributed) : `${totalDistributed} ${unitLabel}` }}
          </strong>
          / {{ item.type === 'money' ? formatCurrency(remaining) : `${remaining} ${unitLabel}` }}
        </span>
      </div>

      <p v-if="exceedsRemaining" class="error">Total exceeds remaining amount</p>

      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-outline">Cancel</button>
        <button @click="handleSubmit" class="btn-primary" :disabled="exceedsRemaining || saving || !rowsValid">
          {{ saving ? 'Distributing...' : 'Distribute' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import CharityService from '@/stores/charity'

const props = defineProps({
  item: Object,          // DonationItem with existing distributions maybe
  beneficiaries: Array,  // all beneficiaries list (from parent)
  saving: Boolean
})

const emit = defineEmits(['close', 'save'])

const rows = ref([])

const typeLabel = computed(() => ({ money:'Money', goods:'Goods', service:'Service' })[props.item?.type] || props.item?.type)
const unitLabel = computed(() => props.item?.type === 'goods' ? 'units' : 'hours/items')

// Calculate remaining available quantity/value
const existingDistributions = ref([])

const loadExistingDist = async () => {
  if (!props.item) return
  const res = await CharityService.getDistributions({ donationId: props.item.donationId })
  if (res.success) {
    existingDistributions.value = res.data.filter(d => d.donationItemId === props.item.donationItemId)
  }
}

const alreadyDistributed = computed(() =>
  existingDistributions.value.reduce((sum, d) => sum + parseFloat(d.value || 0), 0)
)
const remaining = computed(() => {
  if (!props.item) return 0
  if (props.item.type === 'money') {
    return parseFloat(props.item.totalValue) - parseFloat(props.item.unassignedDeduction || 0) - alreadyDistributed.value
  }
  const alreadyQty = existingDistributions.value.reduce((s, d) => s + parseFloat(d.quantity || 0), 0)
  return parseFloat(props.item.quantity) - alreadyQty
})

const totalDistributed = computed(() => {
  if (props.item?.type === 'money') {
    return rows.value.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
  }
  return rows.value.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0) * parseFloat(props.item.unitValue), 0)
})
const exceedsRemaining = computed(() => {
  if (props.item?.type === 'money') {
    const total = rows.value.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0)
    return total > remaining.value
  }
  const totalQty = rows.value.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0)
  return totalQty > remaining.value
})

const rowsValid = computed(() => rows.value.length > 0 && rows.value.every(r => r.beneficiaryId && (props.item?.type === 'money' ? (parseFloat(r.value) > 0) : (parseFloat(r.quantity) > 0))))

const filteredBeneficiaries = computed(() => {
  // Allow all, but optionally filter by type if needed
  return props.beneficiaries || []
})

function addRow() {
  rows.value.push({ beneficiaryId: '', quantity: 0, value: 0 })
}
function removeRow(index) {
  rows.value.splice(index, 1)
}

function handleSubmit() {
  if (exceedsRemaining.value || !rowsValid.value) return
  const payload = rows.value.map(r => {
    const base = { beneficiaryId: r.beneficiaryId }
    if (props.item.type === 'money') {
      // For money items, quantity is the fraction of total value (unitValue)
      const fraction = parseFloat(r.value) / (parseFloat(props.item.unitValue) || 1)
      base.quantity = fraction
      base.value = parseFloat(r.value)
    } else {
      base.quantity = parseFloat(r.quantity)
      base.value = base.quantity * parseFloat(props.item.unitValue)
    }
    return base
  })
  emit('save', payload)
}

onMounted(() => {
  loadExistingDist()
  addRow() // start with one row
})

watch(() => props.item, () => {
  rows.value = []
  addRow()
  loadExistingDist()
}, { immediate: true })
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 100%; max-height: 80vh; overflow-y: auto; }
h3 { margin-bottom: 16px; }
.item-info { display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; }
.dist-rows { margin-bottom: 12px; }
.dist-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 10px; }
.field { display: flex; flex-direction: column; gap: 2px; }
.field label { font-size: 11px; color: #64748b; }
.field select, .field input { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; }
.beneficiary { flex: 2; }
.quantity, .value { flex: 1; }
.computed input { background: #f1f5f9; }
.remove-row { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; padding: 4px; }
.add-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.total-dist { font-size: 14px; color: #475569; }
.error { color: #dc2626; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-outline { background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-secondary { background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
</style>