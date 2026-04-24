<template>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon bg-yellow-300 rounded-lg !p-0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Bars (individual values) -->
          <rect x="4" y="10" width="2.5" height="6" rx="0.8" fill="#fff"/>
          <rect x="8" y="7" width="2.5" height="9" rx="0.8" fill="#fff"/>
          <rect x="12" y="5" width="2.5" height="11" rx="0.8" fill="#fff"/>

          <!-- Total line -->
          <line x1="4" y1="18" x2="16" y2="18" stroke="#fff" stroke-width="2"/>

          <!-- Total indicator -->
          <circle cx="18" cy="6" r="3" fill="#fff"/>
          <line x1="18" y1="4.5" x2="18" y2="7.5" stroke="yellow" stroke-width="1.5"/>
          <line x1="16.5" y1="6" x2="19.5" y2="6" stroke="yellow" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Total Donations</span>
        <span class="stat-value">{{ stats.totalDonations }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-[#2563eb] rounded-lg !p-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      </div>
      <div class="stat-content ">
        <span class="stat-label">Total Value</span>
        <span class="stat-value">{{ formatCurrency(stats.totalValue) }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-green-300 rounded-lg !p-3">
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="#fff" class="size-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Approved</span>
        <span class="stat-value">{{ stats.statusBreakdown?.approved || 0 }}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-gray-100 rounded-lg !p-0">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Center node -->
          <circle cx="12" cy="12" r="2" fill="#2563eb"/>

          <!-- Connecting lines -->
          <line x1="12" y1="12" x2="5" y2="5" stroke="#2563eb" stroke-width="1.5"/>
          <line x1="12" y1="12" x2="19" y2="5" stroke="#2563eb" stroke-width="1.5"/>
          <line x1="12" y1="12" x2="5" y2="19" stroke="#2563eb" stroke-width="1.5"/>
          <line x1="12" y1="12" x2="19" y2="19" stroke="#2563eb" stroke-width="1.5"/>

          <!-- Distributed items (boxes) -->
          <rect x="3" y="3" width="4" height="4" rx="1" fill="#60a5fa"/>
          <rect x="17" y="3" width="4" height="4" rx="1" fill="#60a5fa"/>
          <rect x="3" y="17" width="4" height="4" rx="1" fill="#60a5fa"/>
          <rect x="17" y="17" width="4" height="4" rx="1" fill="#60a5fa"/>
        </svg>
      </div>
      <div class="stat-content">
        <span class="stat-label">Distributed</span>
        <span class="stat-value">{{ stats.statusBreakdown?.distributed || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import CharityService from "@/stores/charity";

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalDonations: 0,
      totalValue: 0,
      statusBreakdown: {},
      valueByType: {}
    })
  }
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount || 0);
};
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.stat-icon {
  font-size: 32px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>