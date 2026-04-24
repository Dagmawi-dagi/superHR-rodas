<template>
  <div class="donation-create">
    <!-- Back header -->
    <div class="create-header">
      <router-link to="/charity/donations" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </router-link>
      <div class="header-title">
        <h1>New Donation</h1>
        <p>Create a donation draft – you can add items later</p>
      </div>
    </div>

    <form @submit.prevent="createDonation" class="donation-form">
      <!-- Basic Information -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h3>Donation Details</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Company (Donor) <span class="required">*</span></label>
              <select v-model="form.companyId">
                <option value="">Select company</option>
                <option v-for="c in companies" :key="c.companyId" :value="c.companyId">
                  {{ c.name }}
                </option>
              </select>
              <span class="error" v-if="errors.companyId">{{ errors.companyId }}</span>
            </div>
            <div class="form-field">
              <label>Campaign <span class="required">*</span></label>
              <select v-model="form.campaignId">
                <option value="">Select campaign</option>
                <option v-for="c in campaigns" :key="c.campaignId" :value="c.campaignId">
                  {{ c.title }}
                </option>
              </select>
              <span class="error" v-if="errors.campaignId">{{ errors.campaignId }}</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Donation Date <span class="required">*</span></label>
              <input type="date" v-model="form.donationDate" />
              <span class="error" v-if="errors.donationDate">{{ errors.donationDate }}</span>
            </div>
            <div class="form-field">
              <!-- spacer to keep grid layout -->
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>Notes</h3>
          <span class="optional-badge">Optional</span>
        </div>
        <div class="card-body">
          <div class="form-field">
            <textarea v-model="form.notes" rows="3" placeholder="Any additional notes about this donation..."></textarea>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/donations" class="btn-outline">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating...' : 'Create Donation' }}
        </button>
      </div>
    </form>

    <!-- Loading overlay -->
    <div v-if="isSubmitting" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Creating donation...</p>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CharityService from '@/stores/charity'

const router = useRouter()
const toasts = ref([])
const isSubmitting = ref(false)

const form = ref({
  companyId: '',
  campaignId: '',
  donationDate: '',
  notes: ''
})

const errors = ref({})
const companies = ref([])
const campaigns = ref([])

// Toast helpers
const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Load companies and campaigns
const loadCompanies = async () => {
  const res = await CharityService.getCompanies()
  if (res.success) companies.value = res.data
}
const loadCampaigns = async () => {
  const res = await CharityService.getCampaigns()
  if (res.success) campaigns.value = res.data
}

// Validation
const validateForm = () => {
  const newErrors = {}
  if (!form.value.companyId) newErrors.companyId = 'Company is required'
  if (!form.value.campaignId) newErrors.campaignId = 'Campaign is required'
  if (!form.value.donationDate) newErrors.donationDate = 'Date is required'
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Create donation
const createDonation = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  const donationData = {
    companyId: parseInt(form.value.companyId),
    campaignId: parseInt(form.value.campaignId),
    donationDate: form.value.donationDate,
    notes: form.value.notes.trim() || undefined
  }

  const result = await CharityService.createDonation(donationData)

  if (result.success) {
    addToast(`✅ Donation created successfully!`, 'success')
  } else {
    addToast(result.error || 'Failed to create donation', 'error')
  }
  isSubmitting.value = false
}

onMounted(async () => {
  await Promise.all([loadCompanies(), loadCampaigns()])
})
</script>

<style scoped>
.donation-create {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f5f7fb;
  min-height: 100vh;
}

.create-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}
.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #475569;
  text-decoration: none;
}
.back-btn svg { width: 18px; height: 18px; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }

.donation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e9edf2;
  overflow: hidden;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #fafcfc;
  border-bottom: 1px solid #e9edf2;
}
.card-header svg { width: 18px; height: 18px; color: #6366f1; }
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.optional-badge { margin-left: auto; font-size: 11px; font-weight: 500; padding: 2px 8px; background: #e2e8f0; color: #64748b; border-radius: 20px; }
.card-body { padding: 20px; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
}
.form-row:last-child { margin-bottom: 0; }

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
.required { color: #ef4444; }
.form-field input,
.form-field select,
.form-field textarea {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: white;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
.error { font-size: 11px; color: #ef4444; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn-outline {
  padding: 10px 24px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}
.btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
.btn-primary {
  padding: 10px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.loading-section { text-align: center; margin-top: 20px; }
.loading-spinner {
  width: 30px; height: 30px; border: 3px solid #e2e8f0;
  border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.toast-container {
  position: fixed; bottom: 20px; right: 20px; z-index: 2000;
  display: flex; flex-direction: column; gap: 8px;
}
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; max-width: 350px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

@media (max-width: 768px) {
  .donation-create { padding: 16px; }
  .form-row { grid-template-columns: 1fr; }
}
</style>