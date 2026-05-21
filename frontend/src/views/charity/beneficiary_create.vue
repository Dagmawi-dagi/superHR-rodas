<template>
  <div class="beneficiary-create">
    <!-- Back header -->
    <div class="create-header">
      <router-link to="/charity/beneficiaries" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </router-link>
      <div class="header-title">
        <h1>{{ isView ? 'View Beneficiary' : isEdit ? 'Edit Beneficiary' : 'New Beneficiary' }}</h1>
        <p>{{ isView ? 'Viewing details' : isEdit ? 'Update details' : 'Register a new individual or organization' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="beneficiary-form">
      <!-- ── Section 1: Basic Identity ── -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <h3>Basic Identity</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Beneficiary Name <span class="req">*</span></label>
              <input type="text" v-model="form.name" placeholder="Full name or organization name" :disabled="isView" />
              <span class="error" v-if="errors.name">{{ errors.name }}</span>
            </div>
            <div class="form-field">
              <label>Category <span class="req">*</span></label>
              <select v-model="form.type" :disabled="isView">
                <option value="">Select category</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
              <span class="error" v-if="errors.type">{{ errors.type }}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Charity Team (Assignment)</label>
              <div class="select-with-action">
                <select v-model="form.teamId" :disabled="isView">
                  <option value="">No team assigned</option>
                  <option v-for="team in teams" :key="team.teamId" :value="team.teamId">
                    {{ team.name }}
                  </option>
                </select>
                <button v-if="!isView" type="button" class="action-link" @click="openTeamModal">+ New Team</button>
              </div>
            </div>
            <div class="form-field">
              <label>Status</label>
              <div class="status-toggle">
                <label class="switch">
                  <input type="checkbox" v-model="form.isActive" :disabled="isView">
                  <span class="slider round"></span>
                </label>
                <span class="status-label">{{ form.isActive ? 'Active' : 'Inactive' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section 2: Contact Information (Stored in fullInfo) ── -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          <h3>Contact Details</h3>
          <span class="section-tag">Internal Data</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Phone Number</label>
              <input type="tel" v-model="form.phone" placeholder="+251 9..." :disabled="isView" />
            </div>
            <div class="form-field">
              <label>Email Address</label>
              <input type="email" v-model="form.email" placeholder="example@mail.com" :disabled="isView" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Contact Person / Alternate Contact</label>
              <input type="text" v-model="form.contactPerson" placeholder="Full name of representative" :disabled="isView" />
            </div>
          </div>
        </div>
      </div>

      <!-- ── Section 3: Location Information (Stored in fullInfo) ── -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <h3>Address & Location</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Region</label>
              <input type="text" v-model="form.region" placeholder="e.g. Addis Ababa, Amhara" :disabled="isView" />
            </div>
            <div class="form-field">
              <label>City / Town</label>
              <input type="text" v-model="form.city" placeholder="e.g. Addis Ababa, Bahir Dar" :disabled="isView" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Woreda / Sub-city</label>
              <input type="text" v-model="form.woreda" placeholder="e.g. Bole, Kirkos" :disabled="isView" />
            </div>
            <div class="form-field">
              <label>House Number / Specifics</label>
              <input type="text" v-model="form.houseNo" placeholder="Optional details" :disabled="isView" />
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/beneficiaries" class="btn-outline">{{ isView ? 'Back to List' : 'Cancel' }}</router-link>
        <button v-if="!isView" type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : isEdit ? 'Update Beneficiary' : 'Register Beneficiary' }}
        </button>
      </div>
    </form>

    <!-- Quick Add Team Modal -->
    <div v-if="showTeamModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Form New Charity Team</h3>
          <button @click="showTeamModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Team Name <span class="req">*</span></label>
            <input type="text" v-model="newTeam.name" placeholder="Enter team name" />
          </div>
          <div class="form-group">
            <label>Team Head (Employee)</label>
            <div class="combobox">
              <input
                type="text"
                v-model="employeeSearch"
                @focus="showEmployeeDropdown = true"
                @blur="hideEmployeeDropdown"
                placeholder="Search employees..."
              />
              <div v-if="selectedHead" class="selected-manager">
                {{ selectedHead.fullName }}
                <button @click="selectedHead = null; newTeam.headEmployeeId = null" class="clear-x">×</button>
              </div>
              <div v-if="showEmployeeDropdown" class="combobox-dropdown">
                <div v-for="emp in filteredEmployees" :key="emp.id" class="dropdown-item" @mousedown.prevent="selectHead(emp)">
                  {{ emp.fullName }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showTeamModal = false" class="btn-outline">Cancel</button>
          <button @click="createTeam" :disabled="!newTeam.name || savingTeam" class="btn-primary">
            {{ savingTeam ? 'Saving...' : 'Create Team' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        {{ t.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CharityService from '@/stores/charity'

const router = useRouter()
const route = useRoute()

// ── Compute Mode ──
const isEdit = computed(() => !!route.params.id && route.path.includes('edit'))
const isView = computed(() => !!route.params.id && !route.path.includes('edit'))

// ── Form State (Direct mapping to new schema logic) ──
const form = ref({
  name: '',
  type: '',
  teamId: '',
  isActive: true,
  // Contact (fullInfo.contact)
  phone: '',
  email: '',
  contactPerson: '',
  // Location (fullInfo.location)
  region: '',
  city: '',
  woreda: '',
  houseNo: ''
})

const errors = ref({})
const teams = ref([])
const isSubmitting = ref(false)
const toasts = ref([])

// ── Quick Team State ──
const showTeamModal = ref(false)
const savingTeam = ref(false)
const newTeam = ref({ name: '', headEmployeeId: null })
const employees = ref([])
const employeeSearch = ref('')
const showEmployeeDropdown = ref(false)
const selectedHead = ref(null)

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

// ── Data Loading ──
const loadData = async () => {
  const [tRes, eRes] = await Promise.all([
    CharityService.getTeams(),
    CharityService.getEmployeesForDropdown()
  ])
  if (tRes.success) teams.value = tRes.data
  if (eRes.success) employees.value = eRes.data

  if (isEdit.value || isView.value) {
    const res = await CharityService.getBeneficiaryById(route.params.id)
    if (res.success && res.data) {
      const b = res.data
      form.value.name = b.name
      form.value.type = b.type
      form.value.teamId = b.teamId || ''
      form.value.isActive = b.isActive
      
      // Map JSONB fullInfo back to flat form
      const info = b.fullInfo || {}
      form.value.phone = info.contact?.phone || ''
      form.value.email = info.contact?.email || ''
      form.value.contactPerson = info.contact?.contactPerson || ''
      form.value.region = info.location?.region || ''
      form.value.city = info.location?.city || ''
      form.value.woreda = info.location?.woreda || ''
      form.value.houseNo = info.location?.houseNo || ''
    }
  }
}

// ── Handlers ──
const handleSubmit = async () => {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = 'Name is required'
  if (!form.value.type) errors.value.type = 'Category is required'
  if (Object.keys(errors.value).length > 0) return

  isSubmitting.value = true

  // Construct JSONB fullInfo payload
  const beneficiaryData = {
    name: form.value.name.trim(),
    type: form.value.type,
    teamId: form.value.teamId || null,
    isActive: form.value.isActive,
    fullInfo: {
      contact: {
        phone: form.value.phone,
        email: form.value.email,
        contactPerson: form.value.contactPerson
      },
      location: {
        region: form.value.region,
        city: form.value.city,
        woreda: form.value.woreda,
        houseNo: form.value.houseNo
      }
    }
  }

  const res = isEdit.value 
    ? await CharityService.updateBeneficiary(route.params.id, beneficiaryData)
    : await CharityService.createBeneficiary(beneficiaryData)

  if (res.success) {
    addToast(`Beneficiary "${form.value.name}" saved successfully!`)
    setTimeout(() => router.push('/charity/beneficiaries'), 2000)
  } else {
    addToast(res.error || 'Failed to save beneficiary', 'error')
  }
  isSubmitting.value = false
}

// ── Team Quick-Add Logic ──
const filteredEmployees = computed(() => {
  const q = employeeSearch.value.toLowerCase()
  return employees.value.filter(e => e.fullName.toLowerCase().includes(q))
})
const openTeamModal = () => {
  newTeam.value = { name: '', headEmployeeId: null }
  selectedHead.value = null
  showTeamModal.value = true
}
const selectHead = (emp) => {
  selectedHead.value = emp
  newTeam.value.headEmployeeId = emp.id
  employeeSearch.value = ''
  showEmployeeDropdown.value = false
}
const hideEmployeeDropdown = () => setTimeout(() => showEmployeeDropdown.value = false, 200)

const createTeam = async () => {
  savingTeam.value = true
  const res = await CharityService.createTeam(newTeam.value)
  if (res.success) {
    addToast('New team created')
    const refresh = await CharityService.getTeams()
    if (refresh.success) teams.value = refresh.data
    form.value.teamId = res.data.teamId
    showTeamModal.value = false
  } else {
    addToast(res.error, 'error')
  }
  savingTeam.value = false
}

onMounted(loadData)
</script>

<style scoped>
.beneficiary-create { max-width: 960px; margin: 0 auto; padding: 40px 24px; background: #f8fafc; min-height: 100vh; }
.create-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
.back-btn { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; text-decoration: none; transition: all 0.2s; }
.back-btn:hover { border-color: #6366f1; color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1); }
.header-title h1 { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
.header-title p { font-size: 14px; color: #64748b; margin-top: 4px; }

.beneficiary-form { display: flex; flex-direction: column; gap: 24px; }
.form-card { background: white; border-radius: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden; }
.card-header { display: flex; align-items: center; gap: 12px; padding: 18px 24px; background: #fafcfd; border-bottom: 1px solid #f1f5f9; }
.card-header svg { width: 20px; height: 20px; color: #6366f1; }
.card-header h3 { font-size: 16px; font-weight: 700; color: #334155; margin: 0; }
.section-tag { margin-left: auto; font-size: 11px; font-weight: 600; padding: 4px 10px; background: #f1f5f9; color: #64748b; border-radius: 20px; text-transform: uppercase; }
.card-body { padding: 24px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
.form-row:last-child { margin-bottom: 0; }
.form-field { display: flex; flex-direction: column; gap: 8px; }
.form-field label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }

input, select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; transition: all 0.2s; outline: none; }
input:focus, select:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05); }
input:disabled, select:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }

.select-with-action { display: flex; flex-direction: column; gap: 6px; }
.action-link { align-self: flex-start; background: none; border: none; font-size: 12px; font-weight: 700; color: #6366f1; cursor: pointer; padding: 0; }

.status-toggle { display: flex; align-items: center; gap: 12px; height: 45px; }
.status-label { font-size: 14px; font-weight: 700; color: #334155; }

/* Switch Toggle */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e2e8f0; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: #10b981; }
input:checked + .slider:before { transform: translateX(20px); }
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }

.form-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px; }
.btn-outline { padding: 12px 28px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; color: #475569; font-weight: 600; text-decoration: none; cursor: pointer; }
.btn-primary { padding: 12px 32px; border-radius: 12px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(106, 17, 203, 0.2); }
.btn-primary:disabled { opacity: 0.6; }

.error { font-size: 12px; color: #ef4444; font-weight: 500; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 24px; width: 440px; max-width: 95%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { font-size: 18px; font-weight: 700; margin: 0; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.modal-footer { padding: 20px 24px; background: #fafcfd; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }

.combobox { position: relative; }
.combobox-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 4px; max-height: 200px; overflow-y: auto; z-index: 50; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.dropdown-item { padding: 10px 16px; font-size: 14px; cursor: pointer; }
.dropdown-item:hover { background: #f1f5f9; }
.selected-manager { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: #f1f5f9; border-radius: 8px; margin-top: 8px; font-size: 13px; font-weight: 600; color: #475569; }
.clear-x { background: none; border: none; color: #ef4444; font-size: 16px; cursor: pointer; padding: 0 4px; }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 2000; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; gap: 16px; } }
</style>
