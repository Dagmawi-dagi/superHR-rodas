<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Total Groups</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon active !p-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-white"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Active Groups</span>
        <span class="stat-value">{{ stats.active }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon primary !p-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Total Beneficiaries</span>
        <span class="stat-value">{{ stats.totalBeneficiaries }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: { type: Object, default: () => ({ total: 0, active: 0, totalBeneficiaries: 0 }) }
});
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.stat-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #64748b; }
.stat-icon.active { background: #10b981; }
.stat-icon.primary { background: #3b82f6; }
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: #64748b; font-weight: 500; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
</style>
