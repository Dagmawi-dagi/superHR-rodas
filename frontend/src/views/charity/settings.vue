<template>
  <div class="charity-settings-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Charity Settings</h1>
        <p class="page-subtitle">Configure global parameters and manage donation companies</p>
      </div>
      <button class="btn-primary" @click="saveSettings" :disabled="saving">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 21 7 13"/><polyline points="7 3 7 8 15 3"/>
        </svg>
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading settings...</p>
    </div>

    <div v-else class="settings-content">
      <!-- Donation Companies Section -->
      <div class="settings-card">
        <div class="card-header">
          <div class="header-icon companies">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div class="header-text">
            <h3>Donation Companies</h3>
            <p>Manage main and partner organizations that provide donations</p>
          </div>
          <button class="btn-secondary" @click="addCompany">+ Add Company</button>
        </div>

        <div class="card-body">
          <div class="companies-list">
            <div v-for="(company, index) in settings.companies" :key="index" class="company-item">
              <div class="company-header">
                <input type="text" v-model="company.name" placeholder="Company Name" class="company-name-input" />
                <button class="remove-btn" @click="removeCompany(index)">×</button>
              </div>
              <div class="company-fields">
                <div class="field-group">
                  <label>Type</label>
                  <select v-model="company.full_info.type">
                    <option value="main">Main Donor</option>
                    <option value="partner">Partner</option>
                    <option value="sister">Sister Company</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Phone</label>
                  <input type="tel" v-model="company.full_info.phone" placeholder="+251..." />
                </div>
                <div class="field-group">
                  <label>Email</label>
                  <input type="email" v-model="company.full_info.email" placeholder="email@company.com" />
                </div>
                <div class="field-group full">
                  <label>Address</label>
                  <input type="text" v-model="company.full_info.address" placeholder="Physical address" />
                </div>
              </div>
            </div>
            <div v-if="!settings.companies.length" class="empty-state">
              <p>No companies configured yet.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- General Configuration Section -->
      <div class="settings-card">
        <div class="card-header">
          <div class="header-icon config">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div class="header-text">
            <h3>General Configuration</h3>
            <p>System-wide defaults for the charity module</p>
          </div>
        </div>
        <div class="card-body">
          <div class="config-grid">
            <div class="field-group">
              <label>Default Currency</label>
              <input type="text" v-model="settings.config.default_currency" placeholder="ETB" />
            </div>
            <div class="field-group">
              <label>Fiscal Year Start</label>
              <input type="date" v-model="settings.config.fiscal_year_start" />
            </div>
            <div class="field-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="settings.config.auto_approve_small_donations" />
                Auto-approve donations under 500 ETB
              </label>
            </div>
          </div>
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

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CharityService from '@/stores/charity'

const loading = ref(false)
const saving = ref(false)
const toasts = ref<any[]>([])

const settings = ref({
  companies: [] as any[],
  config: {
    default_currency: 'ETB',
    fiscal_year_start: '',
    auto_approve_small_donations: false
  }
})

const loadSettings = async () => {
  loading.value = true
  const res = await CharityService.getSettings()
  if (res.success && res.data) {
    settings.value = {
      companies: res.data.companies || [],
      config: res.data.config || {
        default_currency: 'ETB',
        fiscal_year_start: '',
        auto_approve_small_donations: false
      }
    }
  }
  loading.value = false
}

const addCompany = () => {
  settings.value.companies.push({
    name: '',
    full_info: {
      type: 'partner',
      phone: '',
      email: '',
      address: ''
    }
  })
}

const removeCompany = (index: number) => {
  settings.value.companies.splice(index, 1)
}

const addToast = (msg: string, type: string = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

const saveSettings = async () => {
  saving.value = true
  const res = await CharityService.updateSettings(settings.value)
  if (res.success) {
    addToast('Settings saved successfully!')
  } else {
    addToast(res.error || 'Failed to save settings', 'error')
  }
  saving.value = false
}

onMounted(loadSettings)
</script>

<style scoped>
.charity-settings-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; }

.btn-secondary { padding: 6px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; }

.settings-content { display: flex; flex-direction: column; gap: 24px; max-width: 900px; }
.settings-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
.card-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 16px; }
.header-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.header-icon svg { width: 20px; height: 20px; }
.header-icon.companies { background: #eff6ff; color: #3b82f6; }
.header-icon.config { background: #f5f3ff; color: #8b5cf6; }

.header-text { flex: 1; }
.header-text h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.header-text p { font-size: 13px; color: #64748b; margin: 2px 0 0; }

.card-body { padding: 24px; }

.companies-list { display: flex; flex-direction: column; gap: 16px; }
.company-item { padding: 16px; border: 1px solid #f1f5f9; border-radius: 12px; background: #fafafa; }
.company-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.company-name-input { font-size: 15px; font-weight: 700; color: #1e293b; background: none; border: none; border-bottom: 1px dashed #cbd5e1; width: 60%; padding: 4px 0; outline: none; }
.company-name-input:focus { border-bottom-color: #6a11cb; }
.remove-btn { width: 24px; height: 24px; border-radius: 50%; border: none; background: #fee2e2; color: #ef4444; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

.company-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.field-group { display: flex; flex-direction: column; gap: 4px; }
.field-group.full { grid-column: span 3; }
.field-group label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.field-group input, .field-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; }
.field-group input:focus { border-color: #6a11cb; }

.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.checkbox-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #475569; cursor: pointer; margin-top: 12px; }

.loading-state { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state { text-align: center; padding: 32px; color: #94a3b8; font-style: italic; }

.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 12px; }
.toast { padding: 14px 24px; border-radius: 12px; color: white; font-weight: 600; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
</style>
