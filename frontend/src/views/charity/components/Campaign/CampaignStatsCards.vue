<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon">📢</div>
      <div class="stat-content">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">📅</div>
      <div class="stat-content">
        <span class="stat-label">Planned</span>
        <span class="stat-value">{{ stats.planned }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🚀</div>
      <div class="stat-content">
        <span class="stat-label">Active</span>
        <span class="stat-value">{{ stats.active }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">✅</div>
      <div class="stat-content">
        <span class="stat-label">Completed</span>
        <span class="stat-value">{{ stats.completed }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">❌</div>
      <div class="stat-content">
        <span class="stat-label">Cancelled</span>
        <span class="stat-value">{{ stats.cancelled }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: Object })
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px; }
.stat-card { background: white; border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.stat-icon { font-size: 28px; }
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: #64748b; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
</style>