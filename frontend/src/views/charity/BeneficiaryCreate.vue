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
        <h1>{{ isEdit ? 'Edit Beneficiary' : 'Add Beneficiary' }}</h1>
        <p>{{ isEdit ? 'Update beneficiary details' : 'Create a new beneficiary (individual or organization)' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="beneficiary-form">
      <!-- Basic Info -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h3>Basic Information</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Beneficiary Name <span class="required">*</span></label>
              <input type="text" v-model="form.name" placeholder="Full name or organization" />
              <span class="error" v-if="errors.name">{{ errors.name }}</span>
            </div>
            <div class="form-field">
              <label>Type <span class="required">*</span></label>
              <select v-model="form.type">
                <option value="">Select type</option>
                <option value="individual">Individual</option>
                <option value="organization">Organization</option>
              </select>
              <span class="error" v-if="errors.type">{{ errors.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <h3>Contact Information</h3>
          <span class="optional-badge">Optional</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Phone</label>
              <input type="tel" v-model="form.phone" placeholder="+251 9..." />
            </div>
            <div class="form-field">
              <label>Email</label>
              <input type="email" v-model="form.email" placeholder="contact@example.com" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Contact Person</label>
              <input type="text" v-model="form.contactPerson" placeholder="Contact person name" />
            </div>
          </div>
        </div>
      </div>

      <!-- Location & Group -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.66 17.66a8 8 0 1 0-11.32 0L12 22l5.66-4.34z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h3>Location & Group</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Location</label>
              <select v-model="form.locationId">
                <option value="">Select location</option>
                <option v-for="loc in locations" :key="loc.locationId" :value="loc.locationId">
                  {{ loc.region }}, {{ loc.city }} - {{ loc.woreda }}
                </option>
              </select>
              <button type="button" class="add-location-btn" @click="openLocationModal">
                + Add New Location
              </button>
            </div>
            <div class="form-field">
              <label>Beneficiary Group</label>
              <select v-model="form.groupId">
                <option value="">Select group</option>
                <option v-for="group in groups" :key="group.groupId" :value="group.groupId">
                  {{ group.name }}
                </option>
              </select>
              <!-- NEW: Add Group Button -->
              <button type="button" class="add-location-btn" @click="openGroupModal">
                + Add New Group
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/beneficiaries" class="btn-outline">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : isEdit ? 'Update Beneficiary' : 'Create Beneficiary' }}
        </button>
      </div>
    </form>

    <!-- Add Location Modal (existing) -->
    <div v-if="showLocationModal" class="modal-overlay" @click.self="showLocationModal = false">
      <div class="modal">
        <h3>Add New Location</h3>
        <div class="form-group">
          <label>Region <span class="req">*</span></label>
          <input type="text" v-model="newLocation.region" placeholder="e.g. Addis Ababa" />
        </div>
        <div class="form-group">
          <label>City <span class="req">*</span></label>
          <input type="text" v-model="newLocation.city" placeholder="e.g. Addis Ababa" />
        </div>
        <div class="form-group">
          <label>Woreda</label>
          <input type="text" v-model="newLocation.woreda" placeholder="e.g. Bole" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" v-model="newLocation.description" placeholder="Optional description" />
        </div>
        <div class="modal-actions">
          <button @click="showLocationModal = false" class="btn-secondary">Cancel</button>
          <button @click="createLocation" :disabled="!newLocation.region || !newLocation.city || savingLocation" class="btn-primary">
            {{ savingLocation ? 'Saving...' : 'Save Location' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Group Modal -->
    <div v-if="showGroupModal" class="modal-overlay" @click.self="showGroupModal = false">
      <div class="modal">
        <h3>Add New Beneficiary Group</h3>
        <div class="form-group">
          <label>Group Name <span class="req">*</span></label>
          <input type="text" v-model="newGroup.name" placeholder="e.g. Urban Support" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" v-model="newGroup.description" placeholder="Optional description" />
        </div>

        <!-- Searchable employee combobox -->
        <div class="form-group">
          <label>Manager (Employee) <span class="req">*</span></label>
          <div class="combobox">
            <input
              type="text"
              v-model="employeeSearch"
              @focus="showEmployeeDropdown = true"
              @blur="hideEmployeeDropdown"
              placeholder="Search employee..."
              autocomplete="off"
            />
            <!-- Selected employee chip -->
            <div v-if="selectedManager" class="selected-manager">
              {{ selectedManager.fullName }}
              <button @click="clearManager" class="clear-manager">×</button>
            </div>
            <div v-if="showEmployeeDropdown" class="combobox-dropdown">
              <div
                v-for="emp in filteredEmployees"
                :key="emp.id"
                class="combobox-option"
                @mousedown.prevent="selectManager(emp)"
              >
                {{ emp.fullName }}
              </div>
              <div v-if="filteredEmployees.length === 0" class="combobox-no-results">
                No employees found
              </div>
            </div>
          </div>
          <span class="error" v-if="groupErrors.manager">Manager is required</span>
        </div>

        <div class="modal-actions">
          <button @click="showGroupModal = false" class="btn-secondary">Cancel</button>
          <button @click="createGroup" :disabled="savingGroup" class="btn-primary">
            {{ savingGroup ? 'Saving...' : 'Save Group' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]" @click="removeToast(toast.id)">
        {{ toast.message }}
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
const toasts = ref([])
const isSubmitting = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = ref({
  name: '',
  type: '',
  phone: '',
  email: '',
  contactPerson: '',
  locationId: '',
  groupId: ''
})

const errors = ref({})
const locations = ref([])
const groups = ref([])

// Location modal state (existing)
const showLocationModal = ref(false)
const savingLocation = ref(false)
const newLocation = ref({
  region: '',
  city: '',
  woreda: '',
  description: ''
})

// Group modal state (NEW)
const showGroupModal = ref(false)
const savingGroup = ref(false)
const newGroup = ref({
  name: '',
  description: '',
  managerEmployeeId: ''
})

// Toast helpers
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Load dropdowns
const loadLocations = async () => {
  const res = await CharityService.getLocations()
  if (res.success) locations.value = res.data
}
const loadGroups = async () => {
  const res = await CharityService.getBeneficiaryGroups()
  if (res.success) groups.value = res.data
}

// Load beneficiary data for editing
const loadBeneficiary = async (id) => {
  const res = await CharityService.getBeneficiaryById(id)
  if (res.success && res.data) {
    const b = res.data
    form.value.name = b.name || ''
    form.value.type = b.type || ''
    form.value.phone = b.contactInfo?.phone || ''
    form.value.email = b.contactInfo?.email || ''
    form.value.contactPerson = b.contactInfo?.contactPerson || b.contactInfo?.contact_person || ''
    form.value.locationId = b.locationId || ''
    form.value.groupId = b.groupId || ''
  } else {
    addToast('Failed to load beneficiary data', 'error')
    router.push('/charity/beneficiaries')
  }
}

// Validation
const validateForm = () => {
  const newErrors = {}
  if (!form.value.name.trim()) newErrors.name = 'Name is required'
  if (!form.value.type) newErrors.type = 'Type is required'
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Create or update beneficiary
const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  const contactInfo = {}
  if (form.value.phone) contactInfo.phone = form.value.phone
  if (form.value.email) contactInfo.email = form.value.email
  if (form.value.contactPerson) contactInfo.contactPerson = form.value.contactPerson

  const beneficiaryData = {
    name: form.value.name.trim(),
    type: form.value.type,
    contactInfo,
    locationId: form.value.locationId || null,
    groupId: form.value.groupId || null,
  }

  let result
  if (isEdit.value) {
    result = await CharityService.updateBeneficiary(route.params.id, beneficiaryData)
  } else {
    result = await CharityService.createBeneficiary(beneficiaryData)
  }

  if (result.success) {
    addToast(`✅ Beneficiary "${form.value.name}" ${isEdit.value ? 'updated' : 'created'} successfully!`, 'success')
    setTimeout(() => router.push('/charity/beneficiaries'), 2000)
  } else {
    addToast(result.error || 'Failed to save beneficiary', 'error')
  }
  isSubmitting.value = false
}

// Location modal actions (existing)
const openLocationModal = () => {
  newLocation.value = { region: '', city: '', woreda: '', description: '' }
  showLocationModal.value = true
}

const createLocation = async () => {
  if (!newLocation.value.region || !newLocation.value.city) return
  savingLocation.value = true
  const res = await CharityService.createLocation(newLocation.value)
  savingLocation.value = false
  if (res.success) {
    addToast('Location added successfully')
    await loadLocations()
    const newLoc = locations.value.find(
      l => l.region === newLocation.value.region &&
           l.city === newLocation.value.city &&
           l.woreda === (newLocation.value.woreda || '')
    )
    if (newLoc) form.value.locationId = newLoc.locationId
    showLocationModal.value = false
  } else {
    addToast(res.error || 'Failed to create location', 'error')
  }
}
// Employee search state
const employees = ref([])
const employeeSearch = ref('')
const showEmployeeDropdown = ref(false)
const selectedManager = ref(null)
const groupErrors = ref({})

const filteredEmployees = computed(() => {
  if (!employeeSearch.value.trim()) return employees.value
  const search = employeeSearch.value.toLowerCase()
  return employees.value.filter(emp => emp.fullName.toLowerCase().includes(search))
})

const loadEmployees = async () => {
  const res = await CharityService.getEmployeesForDropdown() // uses EmployeesService internally
  if (res.success) {
    employees.value = res.data
  } else {
    addToast(res.error || 'Failed to load employees', 'error')
  }
}

const selectManager = (emp) => {
  selectedManager.value = emp
  newGroup.value.managerEmployeeId = emp.id
  employeeSearch.value = ''   // clear input
  showEmployeeDropdown.value = false
  groupErrors.value.manager = false
}

const clearManager = () => {
  selectedManager.value = null
  newGroup.value.managerEmployeeId = ''
}

const hideEmployeeDropdown = () => {
  // Timeout allows click on option to fire before hiding
  setTimeout(() => {
    showEmployeeDropdown.value = false
  }, 200)
}

// Update openGroupModal to reset states
const openGroupModal = () => {
  newGroup.value = { name: '', description: '', managerEmployeeId: '' }
  selectedManager.value = null
  employeeSearch.value = ''
  groupErrors.value = {}
  showGroupModal.value = true
  loadEmployees()
}

// Update createGroup to validate manager
const createGroup = async () => {
  if (!newGroup.value.name.trim()) {
    addToast('Group name is required', 'error')
    return
  }
  if (!newGroup.value.managerEmployeeId) {
    groupErrors.value.manager = true
    return
  }
  groupErrors.value = {}
  savingGroup.value = true
  const res = await CharityService.createBeneficiaryGroup({
    name: newGroup.value.name.trim(),
    description: newGroup.value.description.trim() || undefined,
    managerEmployeeId: newGroup.value.managerEmployeeId
  })
  savingGroup.value = false
  if (res.success) {
    addToast('Group added successfully')
    await loadGroups()
    const newGrp = groups.value.find(g => g.name === newGroup.value.name.trim())
    if (newGrp) form.value.groupId = newGrp.groupId
    showGroupModal.value = false
  } else {
    addToast(res.error || 'Failed to create group', 'error')
  }
}


onMounted(async () => {
  await Promise.all([loadLocations(), loadGroups()])
  if (isEdit.value) {
    await loadBeneficiary(route.params.id)
  }
})
</script>

<style scoped>
/* ... (keep all existing styles from previous version) ... */
.beneficiary-create {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f5f7fb;
  min-height: 100vh;
}
.create-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.back-btn svg { width: 18px; height: 18px; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }

.beneficiary-form { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: white; border-radius: 16px; border: 1px solid #e9edf2; overflow: hidden; }
.card-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #fafcfc; border-bottom: 1px solid #e9edf2; }
.card-header svg { width: 18px; height: 18px; color: #6366f1; }
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.optional-badge { margin-left: auto; font-size: 11px; font-weight: 500; padding: 2px 8px; background: #e2e8f0; color: #64748b; border-radius: 20px; }
.card-body { padding: 20px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
.form-row:last-child { margin-bottom: 0; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
.required { color: #ef4444; }
.form-field input,
.form-field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}
.form-field input:focus,
.form-field select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
.error { font-size: 11px; color: #ef4444; }

.add-location-btn {
  margin-top: 6px;
  padding: 6px 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: #475569;
  text-align: left;
}
.add-location-btn:hover { background: #e2e8f0; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-outline {
  padding: 10px 24px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; color: #475569;
  text-decoration: none; cursor: pointer; font-weight: 500;
}
.btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
.btn-primary {
  padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white; border: none; font-weight: 500; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: #334155; }
.form-group input { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }

.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; max-width: 350px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
.loading-section { text-align: center; margin-top: 20px; }
.loading-spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .beneficiary-create { padding: 16px; } .form-row { grid-template-columns: 1fr; } }

.combobox {
  position: relative;
}
.combobox input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
}
.selected-manager {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 6px;
  font-size: 13px;
}
.clear-manager {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.combobox-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-top: 4px;
}
.combobox-option {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}
.combobox-option:hover {
  background: #f1f5f9;
}
.combobox-no-results {
  padding: 8px 12px;
  color: #94a3b8;
  font-size: 14px;
}
</style>