<template>
  <div class="group-ben-page">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/charity/groups" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </router-link>
        <div>
          <h1 class="page-title">{{ groupName }}</h1>
          <p class="page-subtitle">{{ beneficiaries.length }} beneficiar{{ beneficiaries.length === 1 ? 'y' : 'ies' }} in this group</p>
        </div>
      </div>
      <button class="btn-primary" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
        Add Beneficiary
      </button>
    </div>

    <!-- Leadership card -->
    <div v-if="groupData" class="leadership-card">
      <div class="leader-item" v-if="groupData.head">
        <span class="leader-label">Team Head</span>
        <span class="leader-name">{{ groupData.head.firstName }} {{ groupData.head.lastName }}</span>
      </div>
      <div class="leader-item" v-if="groupData.viceHead">
        <span class="leader-label">Vice Head</span>
        <span class="leader-name">{{ groupData.viceHead.firstName }} {{ groupData.viceHead.lastName }}</span>
      </div>
      <div class="leader-item">
        <span class="leader-label">Members</span>
        <span class="leader-name">{{ (groupData.members || []).length }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Loading...</p></div>

    <div v-else-if="!beneficiaries.length" class="empty-state">
      <div class="empty-icon">👤</div>
      <h3>No beneficiaries</h3>
      <p>This group has no beneficiaries yet. Add some!</p>
    </div>

    <div v-else class="ben-table-wrap">
      <table class="ben-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ben in beneficiaries" :key="ben.beneficiaryId">
            <td class="name-cell">{{ ben.name }}</td>
            <td><span class="type-badge" :class="ben.type">{{ ben.type }}</span></td>
            <td class="loc-cell">
              <span v-if="ben.Location">{{ ben.Location.city }}, {{ ben.Location.woreda }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="contact-cell">
              {{ ben.contactInfo?.phone || ben.contactInfo?.email || '—' }}
            </td>
            <td class="actions-cell">
              <router-link :to="`/charity/beneficiaries/${ben.beneficiaryId}/edit`" class="action-btn edit-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </router-link>
              <button class="action-btn transfer-btn" title="Transfer to another group" @click="openTransfer(ben)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button class="action-btn remove-btn" title="Remove from group" @click="removeFromGroup(ben)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Beneficiary Modal (quick-add existing unassigned) -->
    <div v-if="addModal.open" class="modal-overlay" @click.self="addModal.open = false">
      <div class="modal-box">
        <h3 class="modal-title">Add Beneficiary to {{ groupName }}</h3>
        <p class="modal-sub">You can assign an existing unassigned beneficiary or create a new one.</p>

        <div class="modal-tabs">
          <button :class="['tab', addModal.tab === 'assign' ? 'active' : '']" @click="addModal.tab = 'assign'">Assign Existing</button>
          <button :class="['tab', addModal.tab === 'create' ? 'active' : '']" @click="addModal.tab = 'create'">Create New</button>
        </div>

        <!-- Assign tab -->
        <template v-if="addModal.tab === 'assign'">
          <div class="form-field">
            <label>Beneficiary ID</label>
            <input v-model.number="addModal.beneficiaryId" type="number" placeholder="Enter beneficiary ID" />
          </div>
        </template>

        <!-- Create tab — redirect to BeneficiaryCreate with groupId pre-filled -->
        <template v-else>
          <p class="info-text">
            Click "Go to Create Form" to create a new beneficiary. The group will be pre-selected.
          </p>
        </template>

        <div v-if="addModal.error" class="error-banner">{{ addModal.error }}</div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="addModal.open = false">Cancel</button>
          <template v-if="addModal.tab === 'assign'">
            <button class="btn-primary" :disabled="addModal.submitting" @click="submitAssign">
              {{ addModal.submitting ? 'Assigning...' : 'Assign to Group' }}
            </button>
          </template>
          <template v-else>
            <router-link
              :to="`/charity/beneficiaries/create?groupId=${groupId}`"
              class="btn-primary"
            >
              Go to Create Form
            </router-link>
          </template>
        </div>
      </div>
    </div>

    <!-- Transfer Modal -->
    <div v-if="transferModal.open" class="modal-overlay" @click.self="transferModal.open = false">
      <div class="modal-box">
        <h3 class="modal-title">Transfer {{ transferModal.ben?.name }}</h3>
        <div class="form-field">
          <label>Target Group ID <span class="req">*</span></label>
          <input v-model.number="transferModal.toGroupId" type="number" placeholder="Enter group ID" />
        </div>
        <div class="form-field">
          <label>Reason <span class="req">*</span></label>
          <textarea v-model="transferModal.reason" rows="2" placeholder="Why is this beneficiary being transferred?"></textarea>
        </div>
        <div v-if="transferModal.error" class="error-banner">{{ transferModal.error }}</div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="transferModal.open = false">Cancel</button>
          <button class="btn-primary" :disabled="transferModal.submitting" @click="submitTransfer">
            {{ transferModal.submitting ? 'Transferring...' : 'Transfer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import charityService, { type Beneficiary, type BeneficiaryGroup } from '@/stores/charity'

const route   = useRoute()
const groupId = computed(() => Number(route.params.id))

const loading      = ref(false)
const groupData    = ref<BeneficiaryGroup | null>(null)
const groupName    = ref('Group Beneficiaries')
const beneficiaries= ref<Beneficiary[]>([])

const addModal = ref({ open: false, tab: 'assign', beneficiaryId: null as number | null, error: '', submitting: false })
const transferModal = ref({ open: false, ben: null as Beneficiary | null, toGroupId: null as number | null, reason: '', error: '', submitting: false })

const load = async () => {
  loading.value = true
  const res = await charityService.getGroupBeneficiaries(groupId.value)
  if (res.success) {
    beneficiaries.value = res.data
    groupName.value = res.group?.name || 'Group Beneficiaries'
  }
  // Also load group metadata for leadership card
  const gRes = await charityService.getBeneficiaryGroupById(groupId.value)
  if (gRes.success) groupData.value = gRes.data
  loading.value = false
}

const openAdd = () => {
  addModal.value = { open: true, tab: 'assign', beneficiaryId: null, error: '', submitting: false }
}

const submitAssign = async () => {
  if (!addModal.value.beneficiaryId) { addModal.value.error = 'Beneficiary ID is required'; return }
  addModal.value.submitting = true
  const res = await charityService.updateBeneficiary(addModal.value.beneficiaryId, { groupId: groupId.value })
  addModal.value.submitting = false
  if (res.success) { addModal.value.open = false; await load() }
  else addModal.value.error = res.error || 'Failed to assign'
}

const openTransfer = (ben: Beneficiary) => {
  transferModal.value = { open: true, ben, toGroupId: null, reason: '', error: '', submitting: false }
}

const submitTransfer = async () => {
  if (!transferModal.value.toGroupId) { transferModal.value.error = 'Target group ID is required'; return }
  if (!transferModal.value.reason.trim()) { transferModal.value.error = 'Reason is required'; return }
  transferModal.value.submitting = true
  const res = await charityService.transferBeneficiary(transferModal.value.ben!.beneficiaryId, transferModal.value.toGroupId, transferModal.value.reason)
  transferModal.value.submitting = false
  if (res.success) { transferModal.value.open = false; await load() }
  else transferModal.value.error = res.error || 'Transfer failed'
}

const removeFromGroup = async (ben: Beneficiary) => {
  if (!confirm(`Remove ${ben.name} from this group? They will be unassigned.`)) return
  const res = await charityService.updateBeneficiary(ben.beneficiaryId, { groupId: null })
  if (res.success) await load()
  else alert(res.error || 'Failed to remove')
}

onMounted(load)
</script>

<style scoped>
.group-ben-page { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; gap: 12px; }
.back-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #f3f4f6; border-radius: 8px; text-decoration: none; color: #374151; }
.back-btn svg { width: 20px; height: 20px; }
.page-title    { font-size: 20px; font-weight: 600; margin: 0; }
.page-subtitle { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

.btn-primary { display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: #6a11cb; color: white; border: none; border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; }
.btn-primary:hover { background: #5a0dab; }
.btn-icon { width: 16px; height: 16px; }

.leadership-card { display: flex; gap: 20px; flex-wrap: wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
.leader-item { display: flex; flex-direction: column; gap: 2px; }
.leader-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: #9ca3af; }
.leader-name  { font-size: 14px; color: #111827; font-weight: 500; }

.loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #6b7280; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.spinner { width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: #6a11cb; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.ben-table-wrap { overflow-x: auto; }
.ben-table { width: 100%; border-collapse: collapse; font-size: 14px; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
.ben-table th { background: #f9fafb; padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e5e7eb; }
.ben-table td { padding: 12px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.ben-table tr:last-child td { border-bottom: none; }

.name-cell { font-weight: 500; color: #111827; }
.type-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.type-badge.individual   { background: #e0f2fe; color: #0369a1; }
.type-badge.organization { background: #f3e8ff; color: #6d28d9; }
.loc-cell, .contact-cell { font-size: 13px; color: #6b7280; }
.muted { color: #d1d5db; }

.actions-cell { display: flex; gap: 6px; align-items: center; }
.action-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; border: 1px solid; cursor: pointer; background: transparent; transition: all .15s; }
.action-btn svg { width: 14px; height: 14px; }
.edit-btn     { border-color: #bbf7d0; color: #15803d; }
.edit-btn:hover { background: #dcfce7; }
.transfer-btn { border-color: #bfdbfe; color: #1d4ed8; }
.transfer-btn:hover { background: #dbeafe; }
.remove-btn   { border-color: #fecaca; color: #dc2626; }
.remove-btn:hover { background: #fee2e2; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: white; border-radius: 14px; padding: 24px; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
.modal-sub { font-size: 13px; color: #6b7280; margin: 0 0 16px; }
.modal-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.tab { padding: 6px 14px; border-radius: 8px; font-size: 13px; background: #f3f4f6; border: 1px solid #e5e7eb; cursor: pointer; }
.tab.active { background: #6a11cb; color: white; border-color: #6a11cb; }
.form-field { margin-bottom: 12px; }
.form-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 5px; }
.form-field input, .form-field textarea { width: 100%; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; box-sizing: border-box; }
.info-text { font-size: 13px; color: #6b7280; margin: 0 0 16px; line-height: 1.6; }
.req { color: #ef4444; }
.error-banner { background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 8px 18px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; }
</style>