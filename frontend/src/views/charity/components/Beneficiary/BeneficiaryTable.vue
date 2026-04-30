<template>
  <div class="table-container">
    <table class="beneficiary-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Group</th>
          <th>Location</th>
          <th>Contact</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ben in beneficiaries" :key="ben.beneficiaryId">
          <td class="name-cell">
            <div class="name-wrapper">
              <span class="beneficiary-name">{{ ben.name }}</span>
              <span class="beneficiary-type-tag">{{ ben.type }}</span>
            </div>
          </td>
          <td>
            <span :class="['type-badge', `type-${ben.type}`]">{{ ben.type }}</span>
          </td>
          <td>{{ ben.BeneficiaryGroup ? `${ben.BeneficiaryGroup.name} - ${ ben.BeneficiaryGroup.manager.firstName} ${ ben.BeneficiaryGroup.manager.lastName }`: 'Unassigned' }}</td>
          <td>{{ ben.BeneficiaryLocation ? `${ben.BeneficiaryLocation.region}, ${ben.BeneficiaryLocation.city}` : 'N/A' }}</td>
          <td>{{ ben.contactInfo?.phone || ben.contactInfo?.email || 'N/A' }}</td>
          <td class="actions-cell">
            <button class="action-btn view" @click="$router.push(`/charity/beneficiaries/${ben?.beneficiaryId}/edit`)" title="View Details">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <!-- <button class="action-btn edit" @click="$router.push(`/charity/beneficiaries/${ben.BeneficiaryId}/edit`)" title="Edit Beneficiary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>-->
             <button class="action-btn transfer" @click="$emit('transfer', ben)" title="Transfer Group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
            <button class="action-btn delete" @click="$emit('delete', ben)" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </td>
        </tr>
        <tr v-if="beneficiaries.length === 0">
          <td colspan="6" class="empty-state">
            <div class="empty-state-content">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3 class="empty-state-title">No beneficiaries found</h3>
              <p class="empty-state-message">Try adjusting your search or filter criteria</p>
              <button class="empty-state-btn" @click="$emit('clear-filters')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="pagination.totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="pagination.currentPage === 1" @click="$emit('go-to-page', pagination.currentPage - 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <span>Page {{ pagination.currentPage }} of {{ pagination.totalPages }}</span>
      <button class="page-btn" :disabled="pagination.currentPage === pagination.totalPages" @click="$emit('go-to-page', pagination.currentPage + 1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  beneficiaries: { type: Array, default: () => [] },
  pagination: { type: Object, default: () => ({ currentPage: 1, totalPages: 1 }) }
});

defineEmits(['view', 'edit', 'transfer', 'delete', 'go-to-page', 'clear-filters']);
</script>

<style scoped>
.table-container { background: white; border-radius: 16px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.beneficiary-table { width: 100%; border-collapse: collapse; min-width: 800px; }
.beneficiary-table th, .beneficiary-table td { padding: 12px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.beneficiary-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
.beneficiary-table td { font-size: 13px; }
.name-cell .name-wrapper { display: flex; flex-direction: column; }
.beneficiary-name { font-weight: 600; color: #1e293b; }
.beneficiary-type-tag { font-size: 11px; color: #64748b; text-transform: capitalize; }
.type-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.type-individual { background: #dbeafe; color: #1e40af; }
.type-group { background: #dcfce7; color: #166534; }
.type-organization { background: #fef3c7; color: #92400e; }
.actions-cell { display: flex; gap: 6px; }
.action-btn { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #64748b; }
.action-btn svg { width: 14px; height: 14px; }
.action-btn.view { background: #10b98120; color: #10b981; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.transfer { background: #f59e0b20; color: #d97706; }
.action-btn.delete { background: #ef444420; color: #dc2626; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding: 16px; }
.page-btn { padding: 8px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }
.page-btn svg { width: 16px; height: 16px; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.empty-state { text-align: center; padding: 60px 20px !important; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
.empty-state-content { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.empty-state-icon { width: 80px; height: 80px; color: #94a3b8; opacity: 0.6; }
.empty-state-title { font-size: 18px; font-weight: 600; color: #475569; margin: 0; }
.empty-state-message { font-size: 14px; color: #64748b; margin: 0; }
.empty-state-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; margin-top: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #6a11cb; font-size: 13px; font-weight: 500; cursor: pointer; }
.empty-state-btn:hover { background: #6a11cb; border-color: #6a11cb; color: white; }
@media (max-width: 768px) { .beneficiary-table { min-width: 650px; } }
</style>