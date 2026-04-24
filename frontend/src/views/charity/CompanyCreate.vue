<template>
  <div class="company-create">
    <div class="create-header">
      <router-link to="/charity/companies" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </router-link>
      <div class="header-title">
        <h1>Add Company</h1>
        <p>Register a new donor organization</p>
      </div>
    </div>

    <form @submit.prevent="createCompany" class="company-form">
      <!-- Basic Info -->
      <div class="form-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h3>Company Details</h3>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label>Company Name <span class="required">*</span></label>
              <input type="text" v-model="form.name" placeholder="e.g. Ethio Telecom" />
              <span class="error" v-if="errors.name">{{ errors.name }}</span>
            </div>
            <div class="form-field">
              <label>Type <span class="required">*</span></label>
              <select v-model="form.type">
                <option value="">Select type</option>
                <option value="main">Main</option>
                <option value="sister">Sister</option>
                <option value="partner">Partner</option>
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
              <label>Email</label>
              <input type="email" v-model="form.email" placeholder="contact@company.com" />
            </div>
            <div class="form-field">
              <label>Phone</label>
              <input type="tel" v-model="form.phone" placeholder="+251 11..." />
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Address</label>
              <input type="text" v-model="form.address" placeholder="Head office address" />
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <router-link to="/charity/companies" class="btn-outline">Cancel</router-link>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating...' : 'Create Company' }}
        </button>
      </div>
    </form>

    <div v-if="isSubmitting" class="loading-section">
      <div class="loading-spinner"></div>
      <p>Creating company...</p>
    </div>

    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]" @click="removeToast(toast.id)">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CharityService from '@/stores/charity'

const router = useRouter()
const toasts = ref([])
const isSubmitting = ref(false)

const form = ref({
  name: '',
  type: '',
  email: '',
  phone: '',
  address: ''
})

const errors = ref({})

const addToast = (message, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => { toasts.value = toasts.value.filter(t => t.id !== id) }

const validateForm = () => {
  const newErrors = {}
  if (!form.value.name.trim()) newErrors.name = 'Name is required'
  if (!form.value.type) newErrors.type = 'Type is required'
  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const createCompany = async () => {
  if (!validateForm()) return
  isSubmitting.value = true
  const contactInfo = {}
  if (form.value.email) contactInfo.email = form.value.email
  if (form.value.phone) contactInfo.phone = form.value.phone
  if (form.value.address) contactInfo.address = form.value.address

  const companyData = {
    name: form.value.name.trim(),
    type: form.value.type,
    contactInfo
  }

  const result = await CharityService.createCompany(companyData)
  if (result.success) {
    addToast(`✅ Company "${form.value.name}" created!`, 'success')
    setTimeout(() => router.push('/charity/companies'), 1500)
  } else {
    addToast(result.error || 'Failed to create company', 'error')
  }
  isSubmitting.value = false
}
</script>

<style scoped>
.company-create {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #f5f7fb;
  min-height: 100vh;
}
.create-header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 32px;
}
.back-btn {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none;
}
.back-btn svg { width: 18px; height: 18px; }
.header-title h1 { font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 4px; }
.header-title p { font-size: 14px; color: #64748b; margin: 0; }
.company-form { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: white; border-radius: 16px; border: 1px solid #e9edf2; overflow: hidden; }
.card-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; background: #fafcfc; border-bottom: 1px solid #e9edf2; }
.card-header svg { width: 18px; height: 18px; color: #6366f1; }
.card-header h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
.optional-badge { margin-left: auto; font-size: 11px; padding: 2px 8px; background: #e2e8f0; color: #64748b; border-radius: 20px; }
.card-body { padding: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
.form-row:last-child { margin-bottom: 0; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 500; color: #334155; }
.required { color: #ef4444; }
.form-field input,
.form-field select {
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; background: white;
}
.form-field input:focus,
.form-field select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
.error { font-size: 11px; color: #ef4444; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; }
.btn-outline {
  padding: 10px 24px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; color: #475569;
  text-decoration: none; cursor: pointer; font-weight: 500;
}
.btn-primary {
  padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white; border: none; font-weight: 500; cursor: pointer;
}
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.loading-section { text-align: center; margin-top: 20px; }
.loading-spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; max-width: 350px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@media (max-width: 768px) { .company-create { padding: 16px; } .form-row { grid-template-columns: 1fr; } }
</style>