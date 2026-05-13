<template>
  <div class="groups-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Beneficiary Groups</h1>
        <p class="page-subtitle">Manage groups, assign heads and members</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
        New Group
      </button>
    </div>

    <!-- Stats -->
    <BeneficiaryGroupStatsCards :stats="groupStats" />

    <div v-if="loading && !groups.length" class="loading-state">
      <div class="spinner"></div>
      <p>Loading groups...</p>
    </div>

    <div v-else>
      <!-- Search Filter -->
      <div class="filters-bar">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" type="text" placeholder="Search groups..." class="search-input" />
        </div>
      </div>

      <!-- Table -->
      <BeneficiaryGroupTable
        :groups="filteredGroups"
        @edit="openEdit"
        @deactivate="deactivateGroup"
      />
    </div>

    <!-- Create/Edit Modal (existing logic preserved) -->
    <div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <h3 class="modal-title">{{ modal.isEdit ? 'Edit Group' : 'New Beneficiary Group' }}</h3>

        <div class="form-field">
          <label>Group Name <span class="req">*</span></label>
          <input v-model="modal.form.name" type="text" placeholder="e.g. Ye Addis Ababa Mektel Lijoch" />
          <span v-if="modal.errors.name" class="error-text">{{ modal.errors.name }}</span>
        </div>

        <div class="form-field">
          <label>Description</label>
          <textarea v-model="modal.form.description" rows="2" placeholder="What does this group serve?"></textarea>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Team Head (Employee ID)</label>
            <input v-model.number="modal.form.headEmployeeId" type="number" placeholder="Employee ID" />
          </div>
          <div class="form-field">
            <label>Vice Head (Employee ID)</label>
            <input v-model.number="modal.form.viceHeadEmployeeId" type="number" placeholder="Employee ID" />
          </div>
        </div>

        <div class="form-field">
          <label>Member Employee IDs <span class="hint">(comma-separated)</span></label>
          <input v-model="modal.membersInput" type="text" placeholder="e.g. 3, 5, 8" />
          <span class="field-hint">Head and vice are always included</span>
        </div>

        <div v-if="modal.error" class="error-banner">{{ modal.error }}</div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancel</button>
          <button class="btn-primary" :disabled="modal.submitting" @click="submitModal">
            {{ modal.submitting ? 'Saving...' : (modal.isEdit ? 'Save Changes' : 'Create Group') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import charityService, { type BeneficiaryGroup } from '@/stores/charity'
import BeneficiaryGroupTable from './components/Beneficiary/BeneficiaryGroupTable.vue'
import BeneficiaryGroupStatsCards from './components/Beneficiary/BeneficiaryGroupStatsCards.vue'

const loading = ref(false)
const groups  = ref<BeneficiaryGroup[]>([])
const search  = ref('')

const groupStats = computed(() => ({
  total: groups.value.length,
  active: groups.value.filter(g => g.isActive).length,
  totalBeneficiaries: groups.value.reduce((sum, g) => sum + (g.beneficiaries?.length || 0), 0)
}))

const filteredGroups = computed(() => {
  if (!search.value.trim()) return groups.value
  const q = search.value.toLowerCase()
  return groups.value.filter(g => g.name.toLowerCase().includes(q))
})

const modal = ref({
  open: false, isEdit: false, editId: null as number | null,
  form: { name: '', description: '', headEmployeeId: null as number | null, viceHeadEmployeeId: null as number | null },
  membersInput: '',
  errors: {} as Record<string, string>,
  error: '', submitting: false,
})

const loadGroups = async () => {
  loading.value = true
  const res = await charityService.getBeneficiaryGroups()
  if (res.success) groups.value = res.data
  loading.value = false
}

const openCreate = () => {
  modal.value = { open: true, isEdit: false, editId: null, form: { name: '', description: '', headEmployeeId: null, viceHeadEmployeeId: null }, membersInput: '', errors: {}, error: '', submitting: false }
}

const openEdit = (group: BeneficiaryGroup) => {
  modal.value = {
    open: true, isEdit: true, editId: group.groupId,
    form: { name: group.name, description: group.description || '', headEmployeeId: group.headEmployeeId || null, viceHeadEmployeeId: group.viceHeadEmployeeId || null },
    membersInput: (group.members || []).join(', '),
    errors: {}, error: '', submitting: false,
  }
}

const closeModal = () => { modal.value.open = false }

const submitModal = async () => {
  modal.value.errors = {}
  if (!modal.value.form.name.trim()) { modal.value.errors.name = 'Group name is required'; return }

  const members = modal.value.membersInput
    .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))

  modal.value.submitting = true
  modal.value.error = ''

  const payload = { ...modal.value.form, members }
  const res = modal.value.isEdit
    ? await charityService.updateBeneficiaryGroup(modal.value.editId!, payload)
    : await charityService.createBeneficiaryGroup(payload)

  modal.value.submitting = false
  if (res.success) { closeModal(); await loadGroups() }
  else modal.value.error = res.error || 'Failed to save group'
}

const deactivateGroup = async (group: BeneficiaryGroup) => {
  if (!confirm(`Deactivate "${group.name}"? All beneficiaries must be unassigned first.`)) return
  const res = await charityService.deleteBeneficiaryGroup(group.groupId)
  if (res.success) await loadGroups()
  else alert(res.error || 'Failed to deactivate')
}

onMounted(loadGroups)
</script>

<style scoped>
.groups-page { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
.page-title  { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; text-decoration: none; transition: opacity .2s;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-icon { width: 18px; height: 18px; }

.filters-bar { background: white; padding: 16px; border-radius: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.search-wrapper { position: relative; max-width: 400px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; }
.search-input { width: 100%; padding: 10px 16px 10px 40px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #6a11cb; }

.loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modal Styles */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: white; border-radius: 14px; padding: 24px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
.modal-title { font-size: 18px; font-weight: 600; margin: 0 0 20px; }
.form-field { margin-bottom: 14px; }
.form-field label { font-size: 13px; font-weight: 500; display: block; margin-bottom: 5px; }
.form-field input, .form-field textarea { width: 100%; padding: 9px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; box-sizing: border-box; }
.form-field input:focus, .form-field textarea:focus { outline: none; border-color: #6a11cb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hint, .field-hint { font-size: 11px; color: #9ca3af; margin-top: 3px; }
.req { color: #ef4444; }
.error-text { font-size: 12px; color: #ef4444; margin-top: 3px; display: block; }
.error-banner { background: #fee2e2; color: #991b1b; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel { padding: 8px 18px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; cursor: pointer; }
</style>
