<template>
  <!-- Extend Modal -->
  <div v-if="showExtendModal" class="modal-overlay" @click.self="$emit('close-extend-modal')">
    <div class="modal">
      <h3>Extend Campaign</h3>
      <p>Set a new end date for <strong>{{ campaignToModify?.title }}</strong></p>
      <div class="form-group">
        <label>New End Date</label>
        <input type="date" v-model="extendDate" class="form-input" />
      </div>
      <div class="form-group">
        <label>Reason</label>
        <textarea v-model="extendReason" rows="2" placeholder="Reason for extension" class="form-textarea"></textarea>
      </div>
      <div class="modal-actions">
        <button @click="$emit('close-extend-modal')" class="btn-secondary">Cancel</button>
        <button @click="emitExtend" :disabled="!extendDate || processing" class="btn-primary">
          {{ processing ? 'Extending...' : 'Extend' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Terminate Modal -->
  <div v-if="showTerminateModal" class="modal-overlay" @click.self="$emit('close-terminate-modal')">
    <div class="modal">
      <h3>Terminate Campaign</h3>
      <p>Are you sure you want to terminate <strong>{{ campaignToModify?.title }}</strong>?</p>
      <div class="form-group">
        <label>Reason</label>
        <textarea v-model="terminateReason" rows="2" placeholder="Reason for termination" class="form-textarea"></textarea>
      </div>
      <div class="modal-actions">
        <button @click="$emit('close-terminate-modal')" class="btn-secondary">Cancel</button>
        <button @click="emitTerminate" :disabled="!terminateReason || processing" class="btn-danger">
          {{ processing ? 'Terminating...' : 'Terminate' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toasts -->
  <div class="toast-container">
    <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]" @click="$emit('remove-toast', toast.id)">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  showExtendModal: Boolean,
  showTerminateModal: Boolean,
  campaignToModify: Object,
  processing: Boolean,
  toasts: Array
})

const emit = defineEmits([
  'close-extend-modal', 'confirm-extend',
  'close-terminate-modal', 'confirm-terminate',
  'remove-toast'
])

const extendDate = ref('')
const extendReason = ref('')
const terminateReason = ref('')

function emitExtend() {
  emit('confirm-extend', { newEndDate: extendDate.value, reason: extendReason.value })
  extendDate.value = ''
  extendReason.value = ''
}

function emitTerminate() {
  emit('confirm-terminate', terminateReason.value)
  terminateReason.value = ''
}
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; color: #1e293b; }
.modal p { margin-bottom: 16px; color: #475569; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #475569; }
.form-input, .form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.form-textarea { resize: vertical; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
.btn-secondary { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; max-width: 350px; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
</style>