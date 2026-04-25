<template>
  <div class="donation-detail" v-if="donation">
    <!-- Back header -->
    <div class="page-header">
      <router-link to="/charity/donations" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </router-link>
      <div>
        <h1 class="page-title">Donation #{{ donation.donationId }}</h1>
        <p class="page-subtitle">
          {{ donation.Company?.name }} → {{ donation.Campaign?.title }}
        </p>
      </div>
      <div class="header-actions">
        <StatusBadge :status="donation.status" />
        <button
          v-if="canSubmit"
          @click="submitDonation"
          class="btn-primary"
          :disabled="submitting"
        >
          Submit for Approval
        </button>
        <button
          v-if="canApprove"
          @click="approveDonation"
          class="btn-primary"
          :disabled="approving"
        >
          Approve
        </button>
        <button
          v-if="canDistribute"
          @click="markDistributed"
          class="btn-primary"
          :disabled="distributing"
        >
          Mark Distributed
        </button>
        <button
          v-if="canCancel"
          @click="openCancelModal"
          class="btn-danger"
          :disabled="canceling"
        >
          Cancel Donation
        </button>
      </div>
    </div>

    <!-- Donation Summary -->
    <div class="summary-card">
      <div class="summary-row">
        <div class="summary-item">
          <span class="label">Company</span>
          <span class="value">{{ donation.Company?.name }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Campaign</span>
          <span class="value">{{ donation.Campaign?.title }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Date</span>
          <span class="value">{{ formatDate(donation.donationDate) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Value</span>
          <span class="value">{{ formatCurrency(donation.totalValue) }}</span>
        </div>
      </div>
      <div class="summary-notes" v-if="donation.notes">
        <span class="label">Notes</span>
        <p>{{ donation.notes }}</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="section-card">
      <div class="section-header">
        <h3>Donation Items</h3>
        <button
          v-if="donation.status === 'draft'"
          @click="openAddItemModal"
          class="btn-secondary"
        >
          + Add Item
        </button>
      </div>

      <table class="items-table" v-if="items.length">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Qty/Amount</th>
            <th>Unit Value</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in items" :key="item.donationItemId">
            <tr>
              <td><span :class="['type-badge', `type-${item.type}`]">{{ getTypeLabel(item.type) }}</span></td>
              <td>{{ item.description || '-' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatCurrency(item.unitValue) }}</td>
              <td class="total-cell">{{ formatCurrency(item.totalValue) }}</td>
              <td>{{ item.type === 'money' ? (item.paymentMethod || 'bank') : '-' }}</td>
              <td class="actions-cell">
                <button v-if="donation?.status === 'approved'" @click="distributingItem = item; showDistributeModal = true" class="action-btn distribute" title="Distribute">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                </button>
                <!-- <button v-if="donation?.status === 'draft'" @click="openEditItemModal(item)" class="action-btn edit" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
                </button> -->
                <button v-if="donation?.status === 'draft'" @click="deleteItem(item)" class="action-btn delete" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                </button>
                <!-- Toggle distribution visibility -->
                <button class="action-btn toggle-dist" @click="toggleDistributions(item.donationItemId)" title="Show distribution">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" v-if="!expandedItems.includes(item.donationItemId)" />
                    <path d="M6 9l6 6 6-6" v-else />
                  </svg>
                </button>
              </td>
            </tr>
            <!-- Distribution details (expandable) -->
            <tr v-if="expandedItems.includes(item.donationItemId)">
              <td colspan="7" class="dist-detail-cell">
                <div class="dist-detail">
                  <div class="dist-header">
                    <h4>Assigned Beneficiaries</h4>
                    <div class="view-toggle">
                      <button
                        :class="['toggle-btn', { active: (distViewMode[item.donationItemId] || 'individual') === 'individual' }]"
                        @click="toggleDistView(item.donationItemId, 'individual')"
                      >
                        Individual
                      </button>
                      <button
                        :class="['toggle-btn', { active: (distViewMode[item.donationItemId] || 'individual') === 'group' }]"
                        @click="toggleDistView(item.donationItemId, 'group')"
                      >
                        By Group
                      </button>
                    </div>
                  </div>

                  <!-- Individual view -->
                  <div v-if="(distViewMode[item.donationItemId] || 'individual') === 'individual'">
                    <div v-if="item.DonationDistributions && item.DonationDistributions.length">
                      <table class="mini-table">
                        <thead>
                          <tr>
                            <th>Beneficiary</th>
                            <th>{{ item.type === 'money' ? 'Amount' : 'Quantity' }}</th>
                            <th>Value</th>
                            <th>Returned?</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="dist in item.DonationDistributions" :key="dist.distributionId">
                            <td>{{ dist.Beneficiary?.name || 'Unknown' }} ({{ dist.Beneficiary?.type }})</td>
                            <td>{{ item.type === 'money' ? formatCurrency(dist.value) : dist.quantity }}</td>
                            <td>{{ formatCurrency(dist.value) }}</td>
                            <td>
                              <span v-if="dist.isReturned" class="returned">Yes ({{ dist.returnReason }})</span>
                              <span v-else>No</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="unassigned" v-if="item.type === 'money' && item.unassignedDeduction > 0">
                        <em>Unassigned deduction: {{ formatCurrency(item.unassignedDeduction) }}</em>
                      </div>
                    </div>
                    <p v-else class="no-dist">No beneficiaries assigned yet.</p>
                  </div>

                  <!-- Group view -->
                  <div v-else>
                    <div v-if="item.DonationDistributions && item.DonationDistributions.length">
                      <table class="mini-table">
                        <thead>
                          <tr>
                            <th>Group</th>
                            <th>{{ item.type === 'money' ? 'Total Amount' : 'Total Quantity' }}</th>
                            <th>Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(group, groupId) in groupedDistributions(item)" :key="groupId">
                            <td>{{ getGroupName(groupId) }}</td>
                            <td>{{ item.type === 'money' ? formatCurrency(group.totalValue) : group.totalQuantity }}</td>
                            <td>{{ formatCurrency(group.totalValue) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p v-else class="no-dist">No beneficiaries assigned yet.</p>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-else class="empty-items">
        <p>No items yet. Add some items to proceed.</p>
      </div>
    </div>

    <!-- Status Transitions Modals -->
    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeCancelModal">
      <div class="modal">
        <h3>Cancel Donation</h3>
        <p>Are you sure you want to cancel this donation?</p>
        <div class="modal-actions">
          <button @click="closeCancelModal" class="btn-secondary">No</button>
          <button @click="cancelDonation" class="btn-danger" :disabled="canceling">Yes, Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Item Modals -->
    <AddItemModal
      v-if="showAddItemModal"
      :donation-id="donationId"
      :saving="savingItem"
      @close="closeAddItemModal"
      @save="addItem"
    />
    <EditItemModal
      v-if="showEditItemModal"
      :show="showEditItemModal"
      :item="editingItem"
      @close="closeEditItemModal"
      @save="updateItem"
      :saving="savingItem"
    />
    <DistributeItemModal
      v-if="showDistributeModal && distributingItem"
      :item="distributingItem"
      :beneficiaries="beneficiaries"
      :saving="distributingSaving"
      @close="showDistributeModal = false; distributingItem = null"
      @save="handleDistribute"
    />

    <!-- Toasts -->
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
  <div v-else class="loading-state">
    <div class="spinner"></div>
    <p>Loading donation...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CharityService from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from './components/DonationItem/StatusBadge.vue'
import AddItemModal from './components/DonationItem/AddItemModal.vue'
import EditItemModal from './components/DonationItem/EditItemModal.vue'
import DistributeItemModal from './components/Donation/DistributeItemModal.vue'


const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const donationId = parseInt(route.params.id)
const donation = ref(null)
const items = computed(() => donation.value?.DonationItems || [])
const loading = ref(false)
const submitting = ref(false)
const approving = ref(false)
const distributing = ref(false)
const canceling = ref(false)
const savingItem = ref(false)

const showCancelModal = ref(false)
const showAddItemModal = ref(false)
const showEditItemModal = ref(false)
const editingItem = ref(null)

const toasts = ref([])
const expandedItems = ref([])

const distViewMode = ref({}) // { [itemId]: 'individual' | 'group' }

function toggleDistView(itemId, mode) {
  distViewMode.value[itemId] = mode
}
// existing… then add:
const groups = ref([])
const loadGroups = async () => {
  const res = await CharityService.getBeneficiaryGroups()
  if (res.success) groups.value = res.data
}

// Group distributions by beneficiary's groupId
function groupedDistributions(item) {
  if (!item.DonationDistributions) return {}
  const groups = {}
  item.DonationDistributions.forEach(dist => {
    const beneficiary = dist.Beneficiary
    if (!beneficiary) return
    const gId = beneficiary.groupId || 'unassigned'
    if (!groups[gId]) {
      groups[gId] = { totalValue: 0, totalQuantity: 0 }
    }
    groups[gId].totalValue += parseFloat(dist.value || 0)
    groups[gId].totalQuantity += parseFloat(dist.quantity || 0)
  })
  return groups
}

function getGroupName(groupId) {
  console.log(groupId)
  if (!groupId || groupId === 'unassigned') return 'Unassigned'
  const group = groups.value.find(g => g.groupId === parseInt(groupId))
  return group ? `${group?.manager?.firstName} ${group?.manager?.lastName}  <${group.name}>` : 'Unassigned'
}


function toggleDistributions(itemId) {
  const idx = expandedItems.value.indexOf(itemId)
  if (idx > -1) {
    expandedItems.value.splice(idx, 1)
  } else {
    expandedItems.value.push(itemId)
    // set default view mode for newly expanded item
    if (!distViewMode.value[itemId]) {
      distViewMode.value[itemId] = 'individual'
    }
  }
}


const beneficiaries = ref([])
const showDistributeModal = ref(false)
const distributingItem = ref(null)

const loadDependencies = async () => {
  const bens = await CharityService.getBeneficiaries()
  if (bens.success) beneficiaries.value = bens.data
}

const addToast = (msg, type='success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => toasts.value = toasts.value.filter(t => t.id !== id)

// Permissions
const canSubmit = computed(() => donation.value?.status === 'draft')
const canApprove = computed(() => donation.value?.status === 'pending' && ['admin','finance'].includes(authStore.user?.role))
const canDistribute = computed(() => donation.value?.status === 'approved')
const canCancel = computed(() => donation.value?.status !== 'cancelled')

const loadDonation = async () => {
  loading.value = true
  const res = await CharityService.getDonationById(donationId)
  if (res.success) donation.value = res.data
  else addToast('Failed to load donation', 'error')
  loading.value = false
}

const submitDonation = async () => {
  submitting.value = true
  const res = await CharityService.submitDonation(donationId)
  if (res.success) {
    addToast('Donation submitted for approval')
    loadDonation()
  } else addToast(res.error || 'Submit failed', 'error')
  submitting.value = false
}

const approveDonation = async () => {
  approving.value = true
  const res = await CharityService.approveDonation(donationId)
  if (res.success) {
    addToast('Donation approved')
    loadDonation()
  } else addToast(res.error || 'Approve failed', 'error')
  approving.value = false
}

const markDistributed = async () => {
  distributing.value = true
  const res = await CharityService.distributeDonation(donationId)
  if (res.success) {
    addToast('Marked as distributed')
    loadDonation()
  } else addToast(res.error || 'Distribute failed', 'error')
  distributing.value = false
}

const openCancelModal = () => showCancelModal.value = true
const closeCancelModal = () => showCancelModal.value = false
const cancelDonation = async () => {
  canceling.value = true
  const res = await CharityService.cancelDonation(donationId)
  if (res.success) {
    addToast('Donation cancelled')
    loadDonation()
    closeCancelModal()
  } else addToast(res.error || 'Cancel failed', 'error')
  canceling.value = false
}

// Items
const openAddItemModal = () => showAddItemModal.value = true
const closeAddItemModal = () => showAddItemModal.value = false
const addItem = async ({ itemData, distributions }) => {
  savingItem.value = true
  // 1. Create the donation item
  const res = await CharityService.addDonationItem(donationId, itemData)
  if (!res.success) {
    addToast(res.error || 'Failed to add item', 'error')
    savingItem.value = false
    return
  }
  // 2. If distributions are provided, immediately create them
  const newItemId = res.data.donationItemId
  if (distributions && distributions.length > 0) {
    const distRes = await CharityService.distributeItem(newItemId, distributions)
    if (distRes.success) {
      addToast('Item added and beneficiaries assigned')
    } else {
      addToast('Item added but assignment failed: ' + distRes.error, 'warning')
    }
  } else {
    addToast('Item added successfully')
  }
  loadDonation()
  closeAddItemModal()
  savingItem.value = false
}

const openEditItemModal = (item) => {
  editingItem.value = { ...item }
  showEditItemModal.value = true
}
const closeEditItemModal = () => {
  showEditItemModal.value = false
  editingItem.value = null
}
const updateItem = async (itemData) => {
  savingItem.value = true
  const res = await CharityService.updateDonationItem(editingItem.value.donationItemId, itemData)
  if (res.success) {
    addToast('Item updated')
    loadDonation()
    closeEditItemModal()
  } else addToast(res.error || 'Update failed', 'error')
  savingItem.value = false
}

const deleteItem = async (item) => {
  if (!confirm(`Delete item "${item.description}"?`)) return
  const res = await CharityService.deleteDonationItem(item.donationItemId)
  if (res.success) {
    addToast('Item deleted')
    loadDonation()
  } else addToast(res.error || 'Delete failed', 'error')
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A'
const formatCurrency = (v) => v ? new Intl.NumberFormat('en-US',{style:'currency',currency:'ETB'}).format(v) : '0.00'
const getTypeLabel = (t) => ({ money:'Money', goods:'Goods', service:'Service' })[t] || t


// Add loadGroups to onMounted dependencies
onMounted(async () => {
  await loadDonation()
  await loadDependencies()
  await loadGroups()
})

</script>

<style scoped>
.donation-detail { padding: 16px; max-width: 1000px; margin: 0 auto; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.back-btn svg { width: 18px; height: 18px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }
.header-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.btn-primary { padding: 8px 16px; border-radius: 10px; background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; cursor: pointer; font-weight: 500; }
.btn-danger { padding: 8px 16px; border-radius: 10px; background: #dc2626; color: white; border: none; cursor: pointer; }
.btn-secondary { padding: 6px 12px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; font-weight: 500; }
.summary-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 16px; }
.summary-item { display: flex; flex-direction: column; }
.label { font-size: 12px; color: #94a3b8; }
.value { font-size: 16px; font-weight: 600; color: #1e293b; }
.summary-notes { margin-top: 12px; }
.summary-notes p { margin: 4px 0 0; color: #475569; }
.section-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-header h3 { margin: 0; font-size: 18px; }
.items-table { width: 100%; border-collapse: collapse; }
.items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.items-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
.type-badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.type-money { background: #dbeafe; color: #1e40af; }
.type-goods { background: #dcfce7; color: #166534; }
.type-service { background: #fef3c7; color: #92400e; }
.total-cell { font-weight: 600; }
.actions-cell { display: flex; gap: 6px; }
.action-btn { width: 28px; height: 28px; border-radius: 6px; display: flex; padding: 5px;align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #64748b; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.delete { background: #ef444420; color: #dc2626; }
.empty-items { text-align: center; padding: 20px; color: #94a3b8; }
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; cursor: pointer; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
.loading-state { text-align: center; padding: 40px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.toggle-dist { color: #8b5cf6; background: none; border: none; cursor: pointer; }
.dist-detail-cell { background: #f8fafc; padding: 12px; }
.dist-detail h4 { font-size: 14px; margin: 0 0 8px; }
.mini-table { width: 100%; font-size: 12px; border-collapse: collapse; }
.mini-table th { background: #e2e8f0; padding: 4px 8px; text-align: left; }
.mini-table td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
.returned { color: #dc2626; font-size: 11px; }
.unassigned { margin-top: 8px; color: #64748b; font-style: italic; }
.no-dist { color: #94a3b8; font-size: 13px; }
.dist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.view-toggle {
  display: flex;
  gap: 4px;
}
.toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
}
.toggle-btn.active {
  background: #6a11cb;
  color: white;
  border-color: #6a11cb;
}
</style>