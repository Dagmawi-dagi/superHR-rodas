<template>
  <span :class="['status-badge', `status-${status}`]">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ status: String })
const label = computed(() => ({
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  distributed: 'Distributed',
  returned: 'Returned',
  cancelled: 'Cancelled'
}[props.status] || props.status))
</script>

<style scoped>
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: capitalize; }
.status-draft { background: #f1f5f9; color: #475569; }
.status-pending { background: #fef3c7; color: #b45309; }
.status-approved { background: #dbeafe; color: #1d4ed8; }
.status-distributed { background: #dcfce7; color: #15803d; }
.status-returned { background: #fdf2f8; color: #9d174d; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }
</style>