<template>
  <div class="charity-dashboard">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isTeamLeader ? 'Team Dashboard' : 'Charity Management Dashboard' }}</h1>
        <p class="page-subtitle">
          {{ isTeamLeader ? 'Overview of your assigned beneficiaries and deliveries' : 'Global overview of charity operations and distribution' }}
        </p>
      </div>
      <div class="header-actions" v-if="!isTeamLeader">
        <router-link to="/charity/settings" class="btn-outline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
          Distribution Settings
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading dashboard statistics...</p>
    </div>

    <div v-else-if="error" class="error-alert">
      {{ error }}
      <button @click="fetchStats">Retry</button>
    </div>

    <template v-else>
      <!-- KPI Grid -->
      <div class="stats-grid">
        <!-- Beneficiaries -->
        <div class="stat-card">
          <div class="stat-icon ben-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <h3>{{ isTeamLeader ? 'My Beneficiaries' : 'Total Beneficiaries' }}</h3>
            <div class="stat-value">{{ stats.beneficiaries.total }}</div>
            <div class="stat-sub">{{ stats.beneficiaries.active }} Active</div>
          </div>
        </div>

        <!-- Allocation -->
        <div class="stat-card">
          <div class="stat-icon alloc-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-info">
            <h3>{{ isTeamLeader ? 'Team Allocation' : 'Global Monthly Total' }}</h3>
            <div class="stat-value">{{ CharityService.formatCurrency(stats.allocation.totalMonthly) }}</div>
            <div class="stat-sub">Monthly Commitment</div>
          </div>
        </div>

        <!-- Teams (Admin only) -->
        <div class="stat-card" v-if="!isTeamLeader">
          <div class="stat-icon team-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div class="stat-info">
            <h3>Distribution Teams</h3>
            <div class="stat-value">{{ stats.teams.total }}</div>
            <div class="stat-sub">{{ stats.teams.active }} Teams Active</div>
          </div>
        </div>

        <!-- Progress -->
        <div class="stat-card">
          <div class="stat-icon prog-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
          </div>
          <div class="stat-info">
            <h3>Current Cycle Progress</h3>
            <div class="stat-value">{{ Math.round((stats.distribution.completed / (stats.distribution.total || 1)) * 100) }}%</div>
            <div class="stat-sub">{{ stats.distribution.completed }} / {{ stats.distribution.total }} Delivered</div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Distribution Details -->
        <div class="dashboard-section main-section">
          <div class="section-header">
            <h2>Current Distribution Cycle</h2>
            <span class="release-tag" v-if="stats.distribution.release">
              Release: {{ CharityService.formatDate(stats.distribution.release.date) }}
            </span>
          </div>
          
          <div class="progress-container">
            <div class="progress-labels">
              <span>Delivery Completion</span>
              <span class="pct">{{ Math.round((stats.distribution.completed / (stats.distribution.total || 1)) * 100) }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: (stats.distribution.completed / (stats.distribution.total || 1)) * 100 + '%' }"></div>
            </div>
            <p class="progress-hint">
              {{ stats.distribution.total - stats.distribution.completed }} beneficiaries still pending payment for this cycle.
            </p>
          </div>

          <div class="quick-links">
            <router-link :to="isTeamLeader ? '/charity/beneficiaries' : '/charity/beneficiaries'" class="q-link">
              <span>View All Beneficiaries</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
            <router-link to="/charity/teams" class="q-link">
              <span>{{ isTeamLeader ? 'My Team Members' : 'Manage Teams' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-section side-section">
          <div class="section-header">
            <h2>Recent Activity</h2>
          </div>
          <div class="activity-feed">
            <div v-for="log in stats.recentActivity" :key="log.logId" class="activity-item">
              <div class="activity-dot" :class="log.action.toLowerCase()"></div>
              <div class="activity-content">
                <div class="activity-msg">
                  <strong>{{ log.user?.fullName || 'System' }}</strong> 
                  {{ getActionText(log) }}
                </div>
                <div class="activity-time">{{ timeAgo(log.created_at) }}</div>
              </div>
            </div>
            <div v-if="stats.recentActivity.length === 0" class="empty-feed">
              No recent activity recorded.
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CharityService from '@/stores/charity'

const authStore = useAuthStore()
const isTeamLeader = computed(() => authStore.user?.role === 'charity_teamleader')

const loading = ref(true)
const error = ref(null)
const stats = ref({
  beneficiaries: { total: 0, active: 0, inactive: 0 },
  teams: { total: 0, active: 0 },
  allocation: { totalMonthly: 0 },
  distribution: { completed: 0, total: 0, release: null },
  recentActivity: []
})

const fetchStats = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await CharityService.getDashboardStats()
    if (res.success) {
      stats.value = {
        beneficiaries: res.data.beneficiaries || { total: 0, active: 0, inactive: 0 },
        teams: res.data.teams || { total: 0, active: 0 },
        allocation: res.data.allocation || { totalMonthly: 0 },
        distribution: res.data.distribution || { completed: 0, total: 0, release: null },
        recentActivity: res.data.recentActivity || []
      }
    } else {
      error.value = res.error
    }
  } catch (err) {
    error.value = 'Failed to connect to server'
  } finally {
    loading.value = false
  }
}

const getActionText = (log) => {
  const action = log.action.toLowerCase()
  const module = log.module.toLowerCase()
  
  if (action === 'create') return `registered a new ${module}`
  if (action === 'update') return `updated ${module} info`
  if (action === 'transfer') return `transferred a beneficiary`
  if (action === 'adjustment') return `applied an allocation adjustment`
  if (action === 'delivery') return `recorded a payment delivery`
  if (action === 'delete') return `deactivated a ${module}`
  
  return `${action}d a ${module}`
}

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(date).toLocaleDateString()
}

onMounted(fetchStats)
</script>

<style scoped>
.charity-dashboard { padding: 24px; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
.page-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
.page-subtitle { color: #64748b; font-size: 14px; margin-top: 4px; }

.btn-outline { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #475569; font-weight: 600; text-decoration: none; transition: all 0.2s; }
.btn-outline:hover { border-color: #6366f1; color: #6366f1; }
.btn-icon { width: 18px; height: 18px; }

/* KPI Stats */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 32px; }
.stat-card { background: white; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
.stat-icon { width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.stat-icon svg { width: 26px; height: 26px; }

.ben-icon { background: #eff6ff; color: #2563eb; }
.alloc-icon { background: #fdf2f7; color: #db2777; }
.team-icon { background: #f0fdf4; color: #16a34a; }
.prog-icon { background: #f5f3ff; color: #7c3aed; }

.stat-info h3 { font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-value { font-size: 24px; font-weight: 800; color: #1e293b; line-height: 1; }
.stat-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500; }

/* Sections */
.dashboard-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.dashboard-section { background: white; border-radius: 24px; padding: 28px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.section-header h2 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
.release-tag { background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

/* Progress */
.progress-container { background: #f8fafc; padding: 24px; border-radius: 20px; margin-bottom: 24px; }
.progress-labels { display: flex; justify-content: space-between; margin-bottom: 12px; font-weight: 600; font-size: 14px; color: #475569; }
.progress-labels .pct { color: #6366f1; font-weight: 800; font-size: 18px; }
.progress-bar-bg { height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 6px; transition: width 1s ease; }
.progress-hint { font-size: 13px; color: #94a3b8; margin-top: 12px; }

.quick-links { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.q-link { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #f1f5f9; border-radius: 16px; text-decoration: none; color: #1e293b; font-weight: 600; transition: all 0.2s; }
.q-link:hover { background: #e2e8f0; transform: translateX(4px); }
.q-link svg { width: 18px; height: 18px; color: #6366f1; }

/* Activity */
.activity-feed { display: flex; flex-direction: column; gap: 20px; }
.activity-item { display: flex; gap: 16px; position: relative; }
.activity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
.activity-dot.create { background: #10b981; box-shadow: 0 0 0 4px #e6f7f0; }
.activity-dot.update { background: #3b82f6; box-shadow: 0 0 0 4px #eff6ff; }
.activity-dot.delivery { background: #8b5cf6; box-shadow: 0 0 0 4px #f5f3ff; }
.activity-dot.adjustment { background: #f59e0b; box-shadow: 0 0 0 4px #fffbeb; }

.activity-content { flex: 1; }
.activity-msg { font-size: 13.5px; color: #334155; line-height: 1.5; }
.activity-time { font-size: 12px; color: #94a3b8; margin-top: 4px; }

.empty-feed { text-align: center; padding: 40px 0; color: #94a3b8; font-style: italic; }

.loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; color: #64748b; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6366f1; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.error-alert { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; padding: 20px; border-radius: 16px; text-align: center; margin: 40px 0; }
.error-alert button { margin-top: 12px; padding: 8px 20px; background: #b91c1c; color: white; border: none; border-radius: 8px; cursor: pointer; }

@media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
</style>
