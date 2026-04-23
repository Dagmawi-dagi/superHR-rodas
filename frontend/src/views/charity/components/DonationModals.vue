<template>
  <!-- Cancel Confirmation Modal -->
  <div v-if="showCancelModal" class="modal-overlay" @click.self="$emit('close-cancel-modal')">
    <div class="modal">
      <h3>Cancel Donation</h3>
      <p>
        Are you sure you want to cancel donation 
        <strong>#{{ donationToCancel?.donationId }}</strong>?
      </p>
      <div class="modal-actions">
        <button @click="$emit('close-cancel-modal')" class="btn-secondary">No, Keep It</button>
        <button @click="$emit('confirm-cancel')" :disabled="canceling" class="btn-danger">
          {{ canceling ? 'Canceling...' : 'Yes, Cancel' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notifications -->
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
      @click="$emit('remove-toast', toast.id)"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  showCancelModal: {
    type: Boolean,
    default: false
  },
  donationToCancel: {
    type: Object,
    default: null
  },
  canceling: {
    type: Boolean,
    default: false
  },
  toasts: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close-cancel-modal', 'confirm-cancel', 'remove-toast']);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
}

.modal h3 { margin-bottom: 16px; color: #1e293b; }
.modal p { margin-bottom: 24px; color: #475569; }

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Toasts */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2000;
}

.toast {
  padding: 12px 20px;
  border-radius: 10px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  animation: slideIn 0.3s ease;
  max-width: 350px;
}

.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>