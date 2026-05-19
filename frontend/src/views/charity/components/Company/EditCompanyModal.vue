<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>Edit Company</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Company Name <span class="req">*</span></label>
          <input v-model="form.name" type="text" required />
        </div>
        <div class="form-group">
          <label>Type</label>
          <select v-model="form.type">
            <option value="main">Main</option>
            <option value="sister">Sister</option>
            <option value="partner">Partner</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input v-model="form.phone" type="tel" />
        </div>
        <div class="form-group">
          <label>Address</label>
          <input v-model="form.address" type="text" />
        </div>
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  company: Object,       // the company to edit
  saving: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  type: 'main',
  email: '',
  phone: '',
  address: ''
})

// Populate form when company prop loads
watch(() => props.company, (newVal) => {
  if (newVal) {
    form.value.name = newVal.name || ''
    form.value.type = newVal.type || 'main'
    form.value.email = newVal.contactInfo?.email || ''
    form.value.phone = newVal.contactInfo?.phone || ''
    form.value.address = newVal.contactInfo?.address || ''
  }
}, { immediate: true })

function handleSubmit() {
  if (!form.value.name.trim()) return
  const contactInfo = {}
  if (form.value.email) contactInfo.email = form.value.email
  if (form.value.phone) contactInfo.phone = form.value.phone
  if (form.value.address) contactInfo.address = form.value.address

  emit('save', {
    name: form.value.name.trim(),
    type: form.value.type,
    contactInfo
  })
}
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 450px; max-width: 90%; }
h3 { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.req { color: #ef4444; }
input, select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-secondary { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>