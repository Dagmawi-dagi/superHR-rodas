<template>
  <!-- Transfer Modal -->
  <div v-if="showTransferModal" class="modal-overlay" @click.self="$emit('close-transfer-modal')">
    <div class="modal">
      <h3>Transfer Beneficiary</h3>
      <p>
        Transfer <strong>{{ beneficiaryToTransfer?.name }}</strong> from 
        <strong>{{ beneficiaryToTransfer?.BeneficiaryGroup?.name || 'No Group' }}</strong> to another group.
      </p>
      <div class="form-group">
        <label>Select Target Group</label>
        <select v-model="transferTargetGroupId" class="form-select">
          <option value="">-- Choose Group --</option>
          <option v-for="g in groups" :key="g.groupId" :value="g.groupId">
            {{ `${g.manager.firstName} ${g.manager.lastName} <${g.name}>` }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Reason for Transfer</label>
        <textarea v-model="transferReason" rows="2" placeholder="Reason..." class="form-textarea"></textarea>
      </div>
      <div class="modal-actions">
        <button @click="$emit('close-transfer-modal')" class="btn-secondary">Cancel</button>
        <button @click="emitTransfer" :disabled="!canTransfer" class="btn-primary">Transfer</button>
      </div>
    </div>
  </div>

  <!-- Delete Modal -->
  <div v-if="showDeleteModal" class="modal-overlay" @click.self="$emit('close-delete-modal')">
    <div class="modal">
      <h3>Delete Beneficiary</h3>
      <p>Are you sure you want to delete <strong>{{ beneficiaryToDelete?.name }}</strong>?</p>
      <div class="modal-actions">
        <button @click="$emit('close-delete-modal')" class="btn-secondary">Cancel</button>
        <button @click="$emit('confirm-delete')" :disabled="deleting" class="btn-danger">
          {{ deleting ? 'Deleting...' : 'Delete' }}
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
import { ref, computed } from 'vue';

const props = defineProps({
  showTransferModal: Boolean,
  showDeleteModal: Boolean,
  beneficiaryToTransfer: Object,
  beneficiaryToDelete: Object,
  groups: { type: Array, default: () => [] },
  deleting: Boolean,
  toasts: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'close-transfer-modal', 'confirm-transfer',
  'close-delete-modal', 'confirm-delete',
  'remove-toast'
]);

const transferTargetGroupId = ref('');
const transferReason = ref('');

const canTransfer = computed(() => transferTargetGroupId.value && transferReason.value.trim());

function emitTransfer() {
  emit('confirm-transfer', {
    beneficiaryId: props.beneficiaryToTransfer?.beneficiaryId,
    toGroupId: transferTargetGroupId.value,
    reason: transferReason.value
  });
  // Reset
  transferTargetGroupId.value = '';
  transferReason.value = '';
}
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; color: #1e293b; }
.modal p { margin-bottom: 16px; color: #475569; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; color: #475569; }
.form-select, .form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.form-textarea { resize: vertical; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
.btn-secondary { padding: 8px 16px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.toast-container { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 2000; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; font-weight: 500; cursor: pointer; animation: slideIn 0.3s ease; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>