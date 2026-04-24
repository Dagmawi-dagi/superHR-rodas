<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>Edit Item</h3>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Type (cannot change)</label>
          <input :value="localItem.type" disabled />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input v-model="localItem.description" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" step="0.01" v-model="localItem.quantity" required />
          </div>
          <div class="form-group">
            <label>Unit Value</label>
            <input type="number" step="0.01" v-model="localItem.unitValue" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-outline">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Update' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({ item: Object, saving: Boolean })
const emit = defineEmits(['save', 'close'])

const localItem = reactive({ ...props.item })

watch(() => props.item, (val) => Object.assign(localItem, val))

const handleSubmit = () => {
  emit('save', {
    quantity: Number(localItem.quantity),
    unitValue: Number(localItem.unitValue),
    description: localItem.description
  })
}
</script>

<style scoped>
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 450px; max-width: 90%; }
h3 { margin-bottom: 16px; }
.form-group { margin-bottom: 12px; }
label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
input, select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.btn-outline { background: white; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
</style>