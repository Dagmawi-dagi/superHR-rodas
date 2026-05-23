<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <h3>{{ type === 'reject' ? 'Reject Request' : 'Add Comment' }}</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <p v-if="type === 'reject'">Provide a reason for rejecting this request. It will be finalized as Rejected.</p>
        <p v-else>Add a comment or ask for clarification. The status will move to 'Clarification'.</p>
        <textarea v-model="text" class="modal-textarea" rows="4" placeholder="Enter text here..."></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Cancel</button>
        <button :class="['btn-primary', type === 'reject' ? 'danger' : '']" @click="submit" :disabled="!text.trim() || processing">
          {{ processing ? 'Processing...' : type === 'reject' ? 'Reject Request' : 'Send Comment' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  type:   { type: String, default: 'comment' }, // 'comment' | 'reject'
  processing: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit'])
const text = ref('')

const submit = () => {
  if (!text.value.trim()) return
  emit('submit', text.value)
  text.value = ''
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1200; padding: 20px; }
.modal-box { background: white; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.modal-header { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 18px; color: #1e293b; }
.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-body p { font-size: 14px; color: #64748b; margin-bottom: 16px; }
.modal-textarea { width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; padding: 12px; font-size: 14px; outline: none; resize: none; transition: border-color 0.2s; }
.modal-textarea:focus { border-color: #6a11cb; }
.modal-footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; }
.btn-secondary { background: white; border: 1px solid #e2e8f0; color: #64748b; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.btn-primary { background: #6a11cb; color: white; border: none; padding: 10px 24px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.btn-primary.danger { background: #ef4444; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>