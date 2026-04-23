<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-content">
        <span class="stat-label">Total Beneficiaries</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🏢</div>
      <div class="stat-content">
        <span class="stat-label">Organizations</span>
        <span class="stat-value">{{ stats.organizations }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👨‍👩‍👧‍👦</div>
      <div class="stat-content">
        <span class="stat-label">Groups</span>
        <span class="stat-value">{{ stats.groups }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🧑</div>
      <div class="stat-content">
        <span class="stat-label">Individuals</span>
        <span class="stat-value">{{ stats.individuals }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    default: () => ({ total: 0, organizations: 0, groups: 0, individuals: 0 })
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.stat-icon { font-size: 32px; }
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 14px; color: #64748b; }
.stat-value { font-size: 28px; font-weight: 700; color: #1e293b; }
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
</style>