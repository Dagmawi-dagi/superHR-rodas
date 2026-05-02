<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal" style="max-width: 850px; max-height: 90vh; overflow-y: auto;">
      <h3>{{ isEdit ? 'Edit Donation Item' : 'Add Donation Item &amp; Assign Beneficiaries' }}</h3>
      
      <form @submit.prevent="handleSubmit">
        <!-- ============ Item Details ============ -->
        <div class="section">
          <h4>Item Details</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Type <span class="req">*</span></label>
              <select v-model="form.type" required :disabled="isEdit">
                <option value="">Select</option>
                <option value="money">Money</option>
                <option value="goods">Goods</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input v-model="form.description" placeholder="e.g., Blankets" />
            </div>
          </div>

          <div class="form-row" v-if="form.type !== 'money'">
            <div class="form-group">
              <label>Quantity / Total Units</label>
              <input type="number" step="0.01" v-model.number="form.quantity" required />
            </div>
            <div class="form-group">
              <label>Unit Value (per unit)</label>
              <input type="number" step="0.01" v-model.number="form.unitValue" required />
            </div>
          </div>

          <div class="form-row" v-if="form.type === 'money'">
            <div class="form-group full-width">
              <label>Amount <span class="req">*</span></label>
              <input type="number" step="0.01" v-model.number="form.unitValue" required />
              <small class="help-text">Total amount of money being donated.</small>
            </div>
          </div>

          <div v-if="form.type === 'money'" class="form-group">
            <label>Payment Method</label>
            <select v-model="form.paymentMethod">
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <div class="computed-total">
            <strong>Item Total:</strong>
            {{ form.type === 'money' ? formatCurrency(form.unitValue) : formatCurrency(form.quantity * form.unitValue) }}
          </div>
        </div>

        <!-- ============ Group Assignment (Bulk) ============ -->
        <div class="section">
          <h4>Assign by Beneficiary Group</h4>
          <p class="help">
            Select one or more groups, then click the button to auto‑fill an equal split
            among all members of the selected groups. You can then adjust individual amounts below.
          </p>
          <div class="group-checkboxes">
            <label
              v-for="group in groups"
              :key="group.groupId"
              class="checkbox-label"
            >
              <span class="custom-checkbox">
                <input type="checkbox" :value="group.groupId" v-model="selectedGroupIds" />
                <span class="checkmark"></span>
              </span>
              <span>{{ group?.manager?.firstName }} {{ group?.manager?.lastName }} &lt;{{ group?.name }}&gt;</span>
            </label>
          </div>
          <button
            type="button"
            class="btn-secondary"
            :disabled="selectedGroupIds.length === 0"
            @click="assignFromGroups"
          >
            Assign to Selected Groups ({{ selectedGroupIds.length }})
          </button>
          <span class="help">Or manually add beneficiaries</span>
        </div>

        <!-- ============ Individual Assignment ============ -->
        <div class="section">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin:0;">Individual Assignment</h4>
          </div>
          <div v-for="(row, index) in distributionRows" :key="index" class="dist-row">
            <div class="field beneficiary">
              <label>Beneficiary</label>
              <select v-model="row.beneficiaryId">
                <option value="">Select</option>
                <option v-for="b in beneficiariesList" :key="b.beneficiaryId" :value="b.beneficiaryId">
                  {{ b.name }} ({{ b.type }})
                </option>
              </select>
            </div>
            <div v-if="form.type !== 'money'" class="field quantity">
              <label>Quantity</label>
              <input type="number" v-model.number="row.quantity" min="0" step="0.01" />
            </div>
            <div v-else class="field value">
              <label>Amount</label>
              <input type="number" v-model.number="row.value" min="0" step="0.01" />
            </div>
            <div class="field total" v-if="form.type !== 'money'">
              <label>Value</label>
              <input :value="formatCurrency(row.quantity * form.unitValue)" disabled />
            </div>
            <button type="button" class="remove-row" @click="removeDistributionRow(index)">×</button>
          </div>
          <button type="button" class="btn-secondary" @click="addDistributionRow">+ Add Beneficiary</button>
          <div class="dist-summary">
            <span>
              <strong>{{ form.type === 'money' ? 'Total Assigned:' : 'Total Quantity Assigned:' }}</strong>
              {{ form.type === 'money' ? formatCurrency(totalAssignedValue) : totalAssignedQuantity }}
            </span>
            <span v-if="exceedsTotal" class="error">Exceeds item total!</span>
            <span v-else-if="totalAssignedValue < totalItemValue && distributionRows.length > 0" class="warning">
              (Remaining: {{ formatCurrency(totalItemValue - totalAssignedValue) }})
            </span>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-outline">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="!isValid || saving">
            {{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Item & Assign' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import CharityService from '@/stores/charity'

const props = defineProps({
  donationId: Number,
  saving: Boolean,
  itemToEdit: Object   // if present, we are editing an existing item
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.itemToEdit)

const beneficiariesList = ref([])
const groups = ref([])
const selectedGroupIds = ref([])

const loadData = async () => {
  const [benRes, groupRes] = await Promise.all([
    CharityService.getBeneficiaries(),
    CharityService.getBeneficiaryGroups()
  ])
  if (benRes.success) beneficiariesList.value = benRes.data
  if (groupRes.success) groups.value = groupRes.data
}

const form = reactive({
  type: 'goods',
  description: '',
  quantity: 1,
  unitValue: 0,
  paymentMethod: 'bank'
})

const distributionRows = ref([])

watch(() => props.itemToEdit, (item) => {
  if (item) {
    form.type = item.type
    form.description = item.description || ''
    if (item.type === 'money') {
      form.quantity = 1
      form.unitValue = parseFloat(item.totalValue) || 0
    } else {
      form.quantity = parseFloat(item.quantity) || 1
      form.unitValue = parseFloat(item.unitValue) || 0
    }
    form.paymentMethod = item.paymentMethod || 'bank'

    // Load existing distributions into rows
    if (item.DonationDistributions && item.DonationDistributions.length) {
      distributionRows.value = item.DonationDistributions.map(dist => ({
        beneficiaryId: dist.beneficiaryId,
        quantity: parseFloat(dist.quantity) || 0,
        value: parseFloat(dist.value) || 0
      }))

      // Pre‑select groups that already have beneficiaries
      const groupIds = new Set()
      item.DonationDistributions.forEach(dist => {
        if (dist.Beneficiary?.groupId) {
          groupIds.add(dist.Beneficiary.groupId)
        }
      })
      selectedGroupIds.value = Array.from(groupIds)
    } else {
      distributionRows.value = []
      selectedGroupIds.value = []
    }
  } else {
    // Reset for add mode
    form.type = 'goods'
    form.description = ''
    form.quantity = 1
    form.unitValue = 0
    form.paymentMethod = 'bank'
    distributionRows.value = []
    selectedGroupIds.value = []
  }
}, { immediate: true })

const totalItemValue = computed(() => {
  return parseFloat(form.quantity) * parseFloat(form.unitValue)
})

const totalAssignedValue = computed(() => {
  return distributionRows.value.reduce((sum, row) => {
    if (form.type === 'money') return sum + (parseFloat(row.value) || 0)
    return sum + (parseFloat(row.quantity) || 0) * parseFloat(form.unitValue)
  }, 0)
})

const totalAssignedQuantity = computed(() => {
  if (form.type === 'money') return 0
  return distributionRows.value.reduce((sum, row) => sum + (parseFloat(row.quantity) || 0), 0)
})

const exceedsTotal = computed(() => {
  const epsilon = 0.001
  if (form.type === 'money') return totalAssignedValue.value - totalItemValue.value > epsilon
  return totalAssignedQuantity.value - parseFloat(form.quantity) > epsilon
})

const isValid = computed(() => {
  if (!form.type || !form.quantity || !form.unitValue) return false
  if (distributionRows.value.length === 0) return false
  const allRowsValid = distributionRows.value.every(r => {
    return r.beneficiaryId && (form.type === 'money' ? parseFloat(r.value) > 0 : parseFloat(r.quantity) > 0)
  })
  return allRowsValid && !exceedsTotal.value
})

function addDistributionRow() {
  distributionRows.value.push({ beneficiaryId: '', quantity: 0, value: 0 })
}
function removeDistributionRow(index) {
  distributionRows.value.splice(index, 1)
}

function assignFromGroups() {
  if (selectedGroupIds.value.length === 0) return
  const selectedIds = selectedGroupIds.value.map(id => parseInt(id))
  const allMembers = beneficiariesList.value.filter(b => selectedIds.includes(b.groupId))
  if (allMembers.length === 0) {
    alert('No beneficiaries found in selected groups.')
    return
  }
  distributionRows.value = []
  if (form.type === 'money') {
    const total = totalItemValue.value
    const perPerson = total / allMembers.length
    const roundedPerPerson = Math.floor(perPerson * 100) / 100
    let remaining = total - roundedPerPerson * allMembers.length
    allMembers.forEach((member, index) => {
      let amount = roundedPerPerson
      if (remaining >= 0.01) {
        amount = Math.round((amount + 0.01) * 100) / 100
        remaining = Math.round((remaining - 0.01) * 100) / 100
      }
      distributionRows.value.push({ beneficiaryId: member.beneficiaryId, quantity: 0, value: amount })
    })
  } else {
    const totalQty = parseFloat(form.quantity)
    const perPersonQty = totalQty / allMembers.length
    const roundedPerPerson = Math.floor(perPersonQty * 100) / 100
    let remainingQty = totalQty - roundedPerPerson * allMembers.length
    allMembers.forEach((member, index) => {
      let qty = roundedPerPerson
      if (remainingQty >= 0.01) {
        qty = Math.round((qty + 0.01) * 100) / 100
        remainingQty = Math.round((remainingQty - 0.01) * 100) / 100
      }
      distributionRows.value.push({ beneficiaryId: member.beneficiaryId, quantity: qty, value: 0 })
    })
  }
}

function handleSubmit() {
  if (!isValid.value) return

  const itemData = {
    type: form.type,
    description: form.description,
    quantity: form.type === 'money' ? 1 : Number(form.quantity),
    unitValue: Number(form.unitValue),
    paymentMethod: form.type === 'money' ? form.paymentMethod : undefined
  }

  const distributions = distributionRows.value.map(row => {
    const dist = { beneficiaryId: row.beneficiaryId }
    if (form.type === 'money') {
        // row.value = monetary amount assigned to this beneficiary
        // unitValue = total monetary amount of the donation item
        const fraction = parseFloat(row.value) / parseFloat(form.unitValue);
        dist.quantity = fraction;          // e.g., 0.375 for 750 ETB out of 2000 ETB
        dist.value = parseFloat(row.value); // actual monetary value
    } else {
        dist.quantity = parseFloat(row.quantity);
        dist.value = parseFloat(row.quantity) * parseFloat(form.unitValue);
    }
      return dist
  })

  emit('save', { itemData, distributions })
}

const formatCurrency = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(v) : '0.00'

onMounted(loadData)
</script>



<style scoped>
/* Keep all existing styles from previous version, add a few new ones */
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 100%; }
h3 { margin-bottom: 16px; }
.section { margin-bottom: 20px; }
.section h4 { font-size: 16px; color: #1e293b; margin-bottom: 8px; }
.help { font-size: 13px; color: #64748b; margin-bottom: 10px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
label { font-size: 13px; color: #334155; }
.req { color: #ef4444; }
input, select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.computed-total { font-size: 14px; color: #475569; margin-top: 8px; }
.dist-row { display: flex; align-items: flex-end; gap: 8px; margin-bottom: 8px; }
.field { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.field.beneficiary { flex: 2; }
.field label { font-size: 11px; color: #64748b; }
.remove-row { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; padding: 4px; }
.dist-summary { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 14px; }
.error { color: #dc2626; font-weight: 600; }
.warning { color: #b45309; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-outline { background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: #f1f5f9; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
.group-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  flex-direction: column; 
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
}

/* custom checkbox container */
.custom-checkbox {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* hide native checkbox */
.custom-checkbox input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
  z-index: 1;
}

/* the visible checkmark */
.custom-checkbox .checkmark {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  background: white;
  transition: all 0.2s;
}

/* hover */
.custom-checkbox:hover .checkmark {
  border-color: #6a11cb;
}

/* checked state */
.custom-checkbox input:checked ~ .checkmark {
  background: #6a11cb;
  border-color: #6a11cb;
}

/* checkmark icon (simple tick via pseudo) */
.custom-checkbox .checkmark::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  opacity: 0;
}

/* show tick when checked */
.custom-checkbox input:checked ~ .checkmark::after {
  opacity: 1;
}
</style>