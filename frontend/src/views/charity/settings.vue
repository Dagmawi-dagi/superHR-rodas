<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1>Charity Settings</h1>
      <p>Configure payment schedules and global defaults</p>
    </div>

    <!-- Tabs -->
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
      </button>
    </div>

    <div class="settings-content">
      <!-- ═══════════════ PAYMENT DATES ═══════════════ -->
      <div v-if="activeTab === 'dates'" class="settings-card">
        <div class="card-header">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <path d="M8 2v4M16 2v4M3 10h18M21 14.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5"/>
              <path d="M21 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/>
              <path d="M18.5 18v3M16.5 18v3"/>
            </svg>
            <h3>Payment Dates</h3>
          </div>
          <button class="btn-save" @click="saveDates" :disabled="savingDates">Save Settings</button>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Next Payment / Distribution Date</label>
              <input type="date" v-model="nextPaymentDate" class="date-input" />
              <span class="hint">This date will be used as the default delivery date for new donations.</span>
            </div>
            <div class="form-group">
              <label>Days Since Last Payment (interval)</label>
              <input type="number" v-model.number="daysSinceLastPayment" min="1" step="1" />
              <span class="hint">Number of days from one payment to the next.</span>
            </div>
          </div>

          <!-- Payment History -->
          <div class="history-list" v-if="paymentHistory.length > 0">
            <h4>Payment History</h4>
            <table class="history-table">
              <thead>
                <tr><th>Date</th><th>Status</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in paymentHistory" :key="idx">
                  <td>{{ formatDate(item.date) }}</td>
                  <td><span :class="['status-badge', item.status === 'completed' ? 'success' : 'pending']">{{ item.status || 'Completed' }}</span></td>
                  <td>{{ item.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-hint">
            No payment history yet. Complete a payment cycle to see history.
          </div>
        </div>
      </div>

      <!-- ═══════════════ DEFAULTS ═══════════════ -->
      <div v-if="activeTab === 'defaults'" class="settings-card">
        <div class="card-header">
          <div class="header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <h3>Global Defaults</h3>
          </div>
          <button class="btn-save" @click="saveDefaults" :disabled="savingDefaults">Save</button>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label>Currency</label>
              <select v-model="config.currency">
                <option value="ETB">ETB (Birr)</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div class="form-group">
              <label>Default Payment Method</label>
              <select v-model="config.defaultPayment">
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Default Monthly Allocation (ETB)</label>
              <input type="number" step="0.01" v-model.number="config.monthlyAllocation" />
            </div>
            <div class="form-group">
              <!-- spacer -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const tabs = [
  { id: 'dates', name: 'Payment Dates' },
  { id: 'defaults', name: 'Defaults' },
]

const activeTab = ref('dates')
const savingDates = ref(false)
const savingDefaults = ref(false)
const toasts = ref([])

// ── Payment Dates ─────────────────────────────────────────────────
const nextPaymentDate = ref('2026-06-15')
const daysSinceLastPayment = ref(30)   // new setting name

const paymentHistory = ref([
  { date: '2026-05-15', status: 'completed', notes: 'May distribution' },
  { date: '2026-04-15', status: 'completed', notes: 'April distribution' },
  { date: '2026-03-15', status: 'completed', notes: 'March distribution' },
  { date: '2026-02-15', status: 'completed', notes: 'February distribution' },
])

const saveDates = async () => {
  savingDates.value = true
  await new Promise(r => setTimeout(r, 400))
  localStorage.setItem('charity_next_payment_date', nextPaymentDate.value)
  localStorage.setItem('charity_days_since_last_payment', String(daysSinceLastPayment.value))
  addToast('Payment settings saved', 'success')
  savingDates.value = false
}

// ── Defaults ─────────────────────────────────────────────────────
const config = reactive({
  currency: 'ETB',
  defaultPayment: 'bank',
  monthlyAllocation: 1500,
})

const saveDefaults = async () => {
  savingDefaults.value = true
  await new Promise(r => setTimeout(r, 400))
  localStorage.setItem('charity_defaults', JSON.stringify(config))
  addToast('Defaults saved', 'success')
  savingDefaults.value = false
}

// ── Helpers ──────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })
}

const addToast = (msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 5000)
}

onMounted(() => {
  const savedNextDate = localStorage.getItem('charity_next_payment_date')
  if (savedNextDate) nextPaymentDate.value = savedNextDate
  const savedDays = localStorage.getItem('charity_days_since_last_payment')
  if (savedDays) daysSinceLastPayment.value = parseInt(savedDays)
  const savedDefaults = localStorage.getItem('charity_defaults')
  if (savedDefaults) {
    const parsed = JSON.parse(savedDefaults)
    Object.assign(config, parsed)
  }
})
</script>

<style scoped>
.settings-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: 100vh;
}
.settings-header {
  margin-bottom: 24px;
}
.settings-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}
.settings-header p {
  color: #64748b;
  font-size: 14px;
}
.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
  border: 1px solid #e2e8f0;
}
.settings-tabs button {
  padding: 8px 24px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #64748b;
}
.settings-tabs button.active {
  background: #6366f1;
  color: white;
}
.settings-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  border: 1px solid #f1f5f9;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fafcfd;
  border-bottom: 1px solid #f1f5f9;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon {
  width: 22px;
  height: 22px;
  color: #6a11cb;
}
.card-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #334155;
  margin: 0;
}
.card-body {
  padding: 24px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.form-row:last-child {
  margin-bottom: 0;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.form-group input,
.form-group select {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #6a11cb;
  box-shadow: 0 0 0 3px rgba(106,17,203,0.1);
}
.hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
.date-input {
  max-width: 280px;
}
.history-list h4 {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 12px;
}
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.history-table th,
.history-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid #e2e8f0;
}
.history-table th {
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
}
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.success {
  background: #e6f7ee;
  color: #0d6b36;
}
.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}
.empty-hint {
  text-align: center;
  padding: 32px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 14px;
}
.btn-save {
  padding: 8px 18px;
  background: linear-gradient(135deg, #6a11cb, #7c3aed);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(106,17,203,0.2);
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toast {
  padding: 14px 24px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
@media (max-width: 768px) {
  .form-row { grid-template-columns: 1fr; }
  .settings-page { padding: 16px; }
  .history-table th, .history-table td { padding: 8px 4px; }
}
</style>