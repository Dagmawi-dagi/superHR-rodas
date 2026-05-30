<template>
  <div class="beneficiary-details">
    <!-- Back header -->
    <div class="details-header">
      <router-link to="/charity/beneficiaries" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </router-link>
      <div class="header-title">
        <h1>Beneficiary Details</h1>
        <p>{{ beneficiary.name }} – Manage deliveries and adjustments</p>
      </div>
      <div class="header-actions">
        <router-link :to="`/charity/beneficiaries/${beneficiaryId}/edit`" class="btn-outline">
          Edit Beneficiary
        </router-link>
      </div>
    </div>

    <!-- Beneficiary Summary Card -->
    <div class="summary-card">
      <div class="summary-grid">
        <div class="summary-item"><span class="label">Full Name</span><span class="value">{{ beneficiary.name }}</span></div>
        <div class="summary-item"><span class="label">Team</span><span class="value">{{ beneficiary.team?.name || '—' }}</span></div>
        <div class="summary-item"><span class="label">Monthly Allocation</span><span class="value allocation-value">{{ formatCurrency(beneficiary.monthlyAllocation) }}</span></div>
        <div class="summary-item"><span class="label">Payment Method</span><span class="value">{{ beneficiary.paymentMethod }}</span></div>
        <div class="summary-item"><span class="label">Status</span><span :class="['status-badge', beneficiary.isActive ? 'active' : 'inactive']">{{ beneficiary.isActive ? 'Active' : 'Inactive' }}</span></div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="details-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
        <span class="tab-count">{{ tab.id === 'deliveries' ? deliveries.length : adjustments.length }}</span>
      </button>
    </div>

    <div class="tab-content">
      <!-- Deliveries Tab -->
      <div v-if="activeTab === 'deliveries'" class="tab-pane">
        <div class="actions-bar">
          <button class="btn-primary small" @click="prepareNewDelivery">+ New Delivery</button>
        </div>

        <!-- Add Delivery Modal (with disabled fields from settings) -->
        <div v-if="showAddDelivery" class="modal-overlay" @click.self="showAddDelivery = false">
          <div class="modal">
            <div class="modal-header">
              <h3>Add New Delivery</h3>
              <button class="modal-close" @click="showAddDelivery = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-field">
                  <label>Delivery Date (auto)</label>
                  <input type="text" :value="formatDate(calculatedDeliveryDate)" disabled />
                  <span class="hint">Calculated from last delivery + {{ daysSinceLastPayment }} days</span>
                </div>
                <div class="form-field">
                  <label>Coverage (days)</label>
                  <input type="number" v-model.number="newDelivery.for_indays" disabled />
                </div>
                <div class="form-field">
                  <label>Delivered?</label>
                  <select v-model="newDelivery.delivered">
                    <option :value="true">Yes</option>
                    <option :value="false">No</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>Receipt Reference</label>
                  <input type="text" v-model="newDelivery.receipt" placeholder="Receipt #" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-field full">
                  <label>Return Reason (if applicable)</label>
                  <input type="text" v-model="newDelivery.is_return.reason" placeholder="Reason for return (optional)" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-outline" @click="showAddDelivery = false">Cancel</button>
              <button class="btn-primary" @click="addDelivery" :disabled="addingDelivery">Add Delivery</button>
            </div>
          </div>
        </div>

        <!-- Deliveries Table -->
        <ListTable
          :columns="deliveryColumns"
          :rows="deliveries"
          row-key="id"
          :pagination="null"
        >
          <template #cell-for_indays="{ value }">{{ value }} days</template>
          <template #cell-delivered="{ value }">
            <span :class="['status-badge', value ? 'active' : 'inactive']">{{ value ? 'Delivered' : 'Pending' }}</span>
          </template>
          <template #cell-is_return="{ row }">
            <span v-if="row.is_return?.reason" class="return-badge" :title="row.is_return.reason">Returned</span>
            <span v-else>—</span>
          </template>
          <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
          <template #actions="{ row }">
            <button @click="removeDelivery(row.id)" class="action-btn delete" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </template>
        </ListTable>
      </div>

      <!-- Adjustments Tab -->
      <div v-if="activeTab === 'adjustments'" class="tab-pane">
        <div class="actions-bar">
          <button class="btn-primary small" @click="showAddAdjustment = true">+ New Adjustment</button>
        </div>

        <!-- Add Adjustment Modal -->
        <div v-if="showAddAdjustment" class="modal-overlay" @click.self="showAddAdjustment = false">
          <div class="modal">
            <div class="modal-header">
              <h3>Add New Adjustment</h3>
              <button class="modal-close" @click="showAddAdjustment = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-row">
                <div class="form-field">
                  <label>Type</label>
                  <select v-model="newAdjustment.type">
                    <option value="increase">Increase Allocation</option>
                    <option value="deduct">Deduct Allocation</option>
                  </select>
                </div>
                <div class="form-field">
                  <label>Amount (ETB)</label>
                  <input type="number" step="0.01" v-model.number="newAdjustment.amount" placeholder="0.00" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-field full">
                  <label>Reason</label>
                  <textarea v-model="newAdjustment.reason" rows="2" placeholder="Reason for adjustment"></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-outline" @click="showAddAdjustment = false">Cancel</button>
              <button class="btn-primary" @click="addAdjustment" :disabled="addingAdjustment">Add Adjustment</button>
            </div>
          </div>
        </div>

        <!-- Adjustments Table -->
        <ListTable
          :columns="adjustmentColumns"
          :rows="adjustments"
          row-key="id"
          :pagination="null"
        >
          <template #cell-type="{ value }">
            <span :class="['type-badge', value === 'increase' ? 'increase' : 'deduct']">{{ value === 'increase' ? 'Increase' : 'Deduct' }}</span>
          </template>
          <template #cell-amount="{ value }">{{ formatCurrency(value) }}</template>
          <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
          <template #cell-createdBy="{ value }">User #{{ value }}</template>
          <template #actions="{ row }">
            <button @click="removeAdjustment(row.id)" class="action-btn delete" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </template>
        </ListTable>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ListTable from './components/common/ListTable.vue'

const route = useRoute()
const router = useRouter()
const beneficiaryId = Number(route.params.id)

const tabs = [
  { id: 'deliveries', name: 'Deliveries' },
  { id: 'adjustments', name: 'Adjustments' },
]
const activeTab = ref('deliveries')
const showAddDelivery = ref(false)
const showAddAdjustment = ref(false)

// Settings from localStorage (loaded on mount)
const daysSinceLastPayment = ref(30)
const globalNextPaymentDate = ref('2026-06-15')

// Dummy data for beneficiary
const beneficiary = ref({
  beneficiaryId: 1,
  name: 'Abebe Kebede',
  team: { teamId: 1, name: 'Team Alpha' },
  monthlyAllocation: 1500,
  paymentMethod: 'bank',
  isActive: true,
})

// Dummy deliveries
const deliveries = ref([
  { id: 1, created_at: '2026-05-15T10:00:00Z', for_indays: 30, is_return: { reason: '' }, delivered: true, receipt: 'REC-001' },
  { id: 2, created_at: '2026-04-10T09:30:00Z', for_indays: 30, is_return: { reason: 'Wrong address' }, delivered: false, receipt: '' },
])

// Dummy adjustments
const adjustments = ref([
  { id: 1, created_at: '2026-05-01T08:00:00Z', type: 'increase', amount: 200, reason: { text: 'Cost of living increase' }, createdBy: 101 },
  { id: 2, created_at: '2026-04-15T14:20:00Z', type: 'deduct', amount: 100, reason: { text: 'Overpayment correction' }, createdBy: 102 },
])

// New delivery form (auto-populated with settings)
const newDelivery = reactive({
  for_indays: 30,
  delivered: true,
  receipt: '',
  is_return: { reason: '' }
})
const addingDelivery = ref(false)

// New adjustment form
const newAdjustment = reactive({
  type: 'increase',
  amount: 0,
  reason: ''
})
const addingAdjustment = ref(false)

// Table columns
const deliveryColumns = [
  { key: 'created_at', label: 'Date' },
  { key: 'for_indays', label: 'Coverage' },
  { key: 'delivered', label: 'Status' },
  { key: 'is_return', label: 'Return' },
  { key: 'receipt', label: 'Receipt' },
]

const adjustmentColumns = [
  { key: 'created_at', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'reason', label: 'Reason', formatter: (val) => val?.text || val },
  { key: 'createdBy', label: 'Created By' },
]

// Toasts
const toasts = ref([])

// Helper functions
function formatCurrency(val) {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(val ?? 0)
}
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ET')
}
function addToast(msg, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

// Load settings from localStorage
function loadSettings() {
  const savedDays = localStorage.getItem('charity_days_since_last_payment')
  if (savedDays) daysSinceLastPayment.value = parseInt(savedDays)
  const savedNextDate = localStorage.getItem('charity_next_payment_date')
  if (savedNextDate) globalNextPaymentDate.value = savedNextDate
}

// Calculate the next delivery date based on last delivery + interval, or fallback to global next date
const calculatedDeliveryDate = computed(() => {
  if (deliveries.value.length === 0) {
    return globalNextPaymentDate.value
  }
  // Get the most recent delivery date (by created_at)
  const sorted = [...deliveries.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const lastDate = new Date(sorted[0].created_at)
  const nextDate = new Date(lastDate)
  nextDate.setDate(lastDate.getDate() + daysSinceLastPayment.value)
  return nextDate.toISOString().split('T')[0]
})

// Prepare modal: set for_indays from setting, and the date will be shown from computed
function prepareNewDelivery() {
  newDelivery.for_indays = daysSinceLastPayment.value
  newDelivery.delivered = true
  newDelivery.receipt = ''
  newDelivery.is_return.reason = ''
  showAddDelivery.value = true
}

// Add delivery (saves the date from computed value as created_at)
function addDelivery() {
  if (addingDelivery.value) return
  addingDelivery.value = true
  const newId = Math.max(0, ...deliveries.value.map(d => d.id), 0) + 1
  const delivery = {
    id: newId,
    created_at: new Date(calculatedDeliveryDate.value).toISOString(),
    for_indays: newDelivery.for_indays,
    delivered: newDelivery.delivered,
    receipt: newDelivery.receipt,
    is_return: { reason: newDelivery.is_return.reason }
  }
  deliveries.value.push(delivery)
  showAddDelivery.value = false
  addToast('Delivery added successfully')
  addingDelivery.value = false
}

function removeDelivery(id) {
  deliveries.value = deliveries.value.filter(d => d.id !== id)
  addToast('Delivery removed', 'error')
}

// Add adjustment with validation
function addAdjustment() {
  if (addingAdjustment.value) return
  if (!newAdjustment.amount || newAdjustment.amount <= 0) {
    addToast('Please enter a valid amount', 'error')
    return
  }
  addingAdjustment.value = true
  let newAllocation = beneficiary.value.monthlyAllocation
  if (newAdjustment.type === 'increase') {
    newAllocation += newAdjustment.amount
  } else {
    newAllocation -= newAdjustment.amount
    if (newAllocation < 0) {
      addToast('Deduction would make allocation negative', 'error')
      addingAdjustment.value = false
      return
    }
  }
  const newId = Math.max(0, ...adjustments.value.map(a => a.id), 0) + 1
  const adjustment = {
    id: newId,
    created_at: new Date().toISOString(),
    type: newAdjustment.type,
    amount: newAdjustment.amount,
    reason: { text: newAdjustment.reason },
    createdBy: 999
  }
  adjustments.value.push(adjustment)
  beneficiary.value.monthlyAllocation = newAllocation
  newAdjustment.type = 'increase'
  newAdjustment.amount = 0
  newAdjustment.reason = ''
  showAddAdjustment.value = false
  addToast(`${adjustment.type === 'increase' ? 'Increased' : 'Deducted'} allocation by ${formatCurrency(adjustment.amount)}. New allocation: ${formatCurrency(beneficiary.value.monthlyAllocation)}`)
  addingAdjustment.value = false
}

function removeAdjustment(id) {
  const adjustmentToRemove = adjustments.value.find(a => a.id === id)
  if (adjustmentToRemove) {
    let newAllocation = beneficiary.value.monthlyAllocation
    if (adjustmentToRemove.type === 'increase') {
      newAllocation -= adjustmentToRemove.amount
    } else {
      newAllocation += adjustmentToRemove.amount
    }
    beneficiary.value.monthlyAllocation = newAllocation
    adjustments.value = adjustments.value.filter(a => a.id !== id)
    addToast(`Adjustment removed. Allocation reverted to ${formatCurrency(beneficiary.value.monthlyAllocation)}`, 'error')
  }
}

// Load beneficiary and settings
onMounted(() => {
  loadSettings()
  if (beneficiaryId === 2) {
    beneficiary.value = {
      beneficiaryId: 2,
      name: 'Mekedonia Association',
      team: null,
      monthlyAllocation: 5000,
      paymentMethod: 'cash',
      isActive: true
    }
    deliveries.value = []
    adjustments.value = []
  } else if (beneficiaryId === 3) {
    beneficiary.value = {
      beneficiaryId: 3,
      name: 'Zelalem Worku',
      team: { teamId: 2, name: 'Team Beta' },
      monthlyAllocation: 800,
      paymentMethod: 'bank',
      isActive: false
    }
    deliveries.value = [{ id: 3, created_at: '2026-05-20T11:00:00Z', for_indays: 30, is_return: { reason: '' }, delivered: false, receipt: '' }]
    adjustments.value = []
  }
})
</script>

<style scoped>
.beneficiary-details { max-width: 1200px; margin: 0 auto; padding: 32px 24px; background: #f5f7fb; min-height: 100vh; }
.details-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.header-title { flex: 1; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }
.header-actions .btn-outline { padding: 8px 16px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: #475569; font-weight: 500; }
.summary-card { background: white; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; border: 1px solid #e9edf2; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.summary-item .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
.summary-item .value { font-size: 16px; font-weight: 600; color: #1e293b; }
.allocation-value { color: #6a11cb; background: #f5f3ff; padding: 2px 8px; border-radius: 20px; display: inline-block; }
.status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.active { background: #e6f7ee; color: #0d6b36; }
.status-badge.inactive { background: #fef1f1; color: #b91c1c; }
.details-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: white; padding: 4px; border-radius: 12px; width: fit-content; border: 1px solid #e2e8f0; }
.details-tabs button { padding: 8px 24px; border: none; background: transparent; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; color: #64748b; display: flex; align-items: center; gap: 8px; }
.details-tabs button.active { background: #6366f1; color: white; }
.tab-count { background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 20px; font-size: 12px; }
.details-tabs button.active .tab-count { background: rgba(255,255,255,0.2); }
.tab-content { background: white; border-radius: 16px; border: 1px solid #e9edf2; overflow: hidden; }
.tab-pane { padding: 24px; }
.actions-bar { display: flex; justify-content: flex-end; margin-bottom: 20px; }
.btn-primary.small { padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; border-radius: 10px; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 20px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
.modal-header h3 { margin: 0; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
input, select, textarea { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; }
input:disabled, select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
.hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.action-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.action-btn.delete { color: #ef4444; }
.return-badge { background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
.type-badge { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.type-badge.increase { background: #e0f2fe; color: #0369a1; }
.type-badge.deduct { background: #fee2e2; color: #b91c1c; }
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>