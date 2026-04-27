<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>

      </div>
      <div class="stat-content">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
       </div>
      <div class="stat-content">
        <span class="stat-label">Active</span>
        <span class="stat-value">{{ stats.active }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
        </svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Inactive</span>
        <span class="stat-value">{{ stats.inactive }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>

      </div>
      <div class="stat-content">
        <span class="stat-label">Main</span>
        <span class="stat-value">{{ stats.main }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon !p-3">🤝</div>
      <div class="stat-content">
        <span class="stat-label">Partner</span>
        <span class="stat-value">{{ stats.partner }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>

      </div>
      <div class="stat-content">
        <span class="stat-label">Sister</span>
        <span class="stat-value">{{ stats.sister }}</span>
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
.stat-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  border-radius: 12px;
}
.stat-content { display: flex; flex-direction: column; }
.stat-label { font-size: 13px; color: #64748b; }
.stat-value { font-size: 24px; font-weight: 700; color: #1e293b; }
</style>