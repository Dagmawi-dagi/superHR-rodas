<template>
  <div class="table-container">
    <table class="company-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Status</th>
          <th>Contact</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in companies" :key="c.companyId">
          <td class="name-cell">{{ c.name }}</td>
          <td><span :class="['type-badge', `type-${c.type}`]">{{ c.type }}</span></td>
          <td>
            <span :class="['status-badge', c.isActive ? 'status-active' : 'status-inactive']">
              {{ c.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>{{ c.contactInfo?.email || c.contactInfo?.phone || 'N/A' }}</td>
          <td class="actions-cell">
            <button class="action-btn view" @click="$emit('view', c)" title="View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
            <button class="action-btn edit" @click="$emit('edit', c)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
            </button>
            <button class="action-btn toggle" @click="$emit('toggle-status', c)" :title="c.isActive ? 'Deactivate' : 'Activate'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </button>
          </td>
        </tr>
        <tr v-if="companies.length === 0">
          <td colspan="5" class="empty-state">
            <p>No companies found</p>
            <button @click="$emit('clear-filters')">Clear Filters</button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Simple pagination (if needed) -->
  </div>
</template>

<script setup>
defineProps({ companies: Array, pagination: Object })
defineEmits(['view', 'edit', 'toggle-status', 'go-to-page', 'clear-filters'])
</script>

<style scoped>
.table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.company-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.company-table th, .company-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.company-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
.name-cell { font-weight: 600; color: #1e293b; }
.type-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.type-main { background: #dbeafe; color: #1e40af; }
.type-sister { background: #dcfce7; color: #166534; }
.type-partner { background: #fef3c7; color: #92400e; }
.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-active { background: #dcfce7; color: #15803d; }
.status-inactive { background: #fee2e2; color: #b91c1c; }
.actions-cell { display: flex; gap: 6px; }
.action-btn { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #64748b; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.view { background: #10b98120; color: #10b981; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.toggle { background: #f59e0b20; color: #d97706; }
.empty-state { text-align: center; padding: 40px; color: #94a3b8; }
</style>