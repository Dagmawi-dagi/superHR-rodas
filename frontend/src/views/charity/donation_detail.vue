<template>
  <div class="donation-detail-page" v-if="donation">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <router-link to="/charity/donations" class="back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </router-link>
        <div>
          <h1 class="page-title">Donation Batch #{{ donation.donationId }}</h1>
          <p class="page-subtitle">
            <span class="team-label">Team:</span> {{ donation.team?.name || 'Unassigned' }}
            <span class="separator">•</span>
            <span class="date-label">Delivery Date:</span> {{ formatDate(donation.donationDeliveryDate) }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <div class="status-badge-wrap">
          <span :class="['status-pill', donation.status]">{{ donation.status.toUpperCase() }}</span>
        </div>
        <button v-if="donation.status === 'draft'" class="btn-primary" @click="submitForApproval" :disabled="processing">
          Submit Batch
        </button>
        <button v-if="donation.status === 'pending'" class="btn-primary success" @click="approveBatch" :disabled="processing">
          Approve Batch
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <StatsCards :cards="donationStats" />

    <!-- Main Content -->
    <div class="detail-grid">
      <div class="main-content">
        <!-- Items Grouped by Beneficiary -->
        <div class="section-card">
          <div class="section-header">
            <h3>Allocated Items</h3>
            <button v-if="donation.status === 'draft'" class="btn-secondary" @click="addItem">+ Add Item</button>
          </div>

          <div v-if="groupedItems.length === 0" class="empty-items">
            <p>No items have been added to this batch yet.</p>
          </div>

          <div v-else class="beneficiary-groups">
            <div v-for="group in groupedItems" :key="group.beneficiaryId" class="ben-group-card">
              <div class="ben-group-header" @click="toggleGroup(group.beneficiaryId)">
                <div class="ben-info">
                  <div class="ben-avatar">{{ group.name[0] }}</div>
                  <div class="ben-meta">
                    <span class="ben-name">{{ group.name }}</span>
                    <span class="ben-type">{{ group.type }}</span>
                  </div>
                </div>
                <div class="group-summary">
                  <span class="item-count">{{ group.items.length }} item(s)</span>
                  <span class="total-val">{{ formatCurrency(group.totalValue) }}</span>
                  <svg class="chevron" :class="{ 'open': expandedGroups.includes(group.beneficiaryId) }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>

              <div v-if="expandedGroups.includes(group.beneficiaryId)" class="ben-items-list">
                <div v-for="item in group.items" :key="item.donationItemId" class="item-row">
                  <div class="item-main">
                    <div class="item-desc">
                      <strong>{{ item.description || 'No description' }}</strong>
                      <div class="item-pills">
                        <span :class="['type-pill', item.type]">{{ item.type }}</span>
                        <span v-if="item.isRecurring" class="recurring-pill">Recurring</span>
                      </div>
                    </div>
                    <div class="item-vals">
                      <div class="val-box">
                        <small>Value/Qty</small>
                        <span v-if="item.type === 'money'">{{ formatCurrency(item.unitValueInBirr) }}</span>
                        <span v-else>{{ item.quantity }} units</span>
                      </div>
                      <div class="val-box total">
                        <small>Total</small>
                        <span>{{ formatCurrency(item.totalValueInBirr) }}</span>
                      </div>
                    </div>
                    <div class="item-actions">
                      <button v-if="donation.status === 'draft'" class="action-btn" title="Edit" @click="editItem(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button v-if="donation.status === 'approved' && !item.isDelivered" class="action-btn success" title="Deliver" @click="markDelivered(item)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Recurring Periods Preview -->
                  <div v-if="item.isRecurring" class="recurring-periods">
                    <div class="periods-header">Distribution Schedule ({{ item.isRecurring.recurring_count }} periods)</div>
                    <div class="periods-grid">
                      <div v-for="rec in item.isRecurring.recurrings" :key="rec.recurring_id" class="period-chip" :class="{ 'delivered': rec.is_delivered }">
                        <span class="p-id">#{{ rec.recurring_id }}</span>
                        <span class="p-val">{{ formatCurrency(rec.total_value_in_birr) }}</span>
                        <span v-if="rec.is_delivered" class="p-check">✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-info">
        <div class="info-card">
          <h3>Batch Details</h3>
          <div class="info-list">
            <div class="info-item">
              <label>Created By</label>
              <span>{{ donation.creator?.full_name || 'System' }}</span>
            </div>
            <div class="info-item">
              <label>Created At</label>
              <span>{{ formatDate(donation.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>Last Updated</label>
              <span>{{ formatDate(donation.updated_at) }}</span>
            </div>
          </div>
        </div>

        <div class="info-card description">
          <h3>Notes</h3>
          <p>{{ donation.description || 'No additional notes provided for this batch.' }}</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- (Using existing donation_item_add_modal.vue via emit from parent or direct logic) -->
  </div>

  <div v-else-if="loading" class="loading-state">
    <div class="spinner"></div>
    <p>Loading donation details...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CharityService, { type CharityDonation, type CharityDonationItem } from '@/stores/charity'
import StatsCards from './components/common/StatsCards.vue'

const route = useRoute()
const router = useRouter()
const donationId = computed(() => String(route.params.id))

const donation = ref<CharityDonation | null>(null)
const loading = ref(false)
const processing = ref(false)
const expandedGroups = ref<number[]>([])

const loadDonation = async () => {
  loading.value = true
  const res = await CharityService.getDonationById(donationId.value)
  if (res.success) {
    donation.value = res.data
    // Auto expand the first group if available
    if (groupedItems.value.length > 0) {
      expandedGroups.value = [groupedItems.value[0].beneficiaryId]
    }
  } else {
    alert('Failed to load donation details')
    router.push('/charity/donations')
  }
  loading.value = false
}

const groupedItems = computed(() => {
  if (!donation.value?.items) return []
  const groups: any[] = []
  
  donation.value.items.forEach(item => {
    const ben = item.beneficiary
    if (!ben) return

    let group = groups.find(g => g.beneficiaryId === ben.beneficiaryId)
    if (!group) {
      group = {
        beneficiaryId: ben.beneficiaryId,
        name: ben.name,
        type: ben.type,
        totalValue: 0,
        items: []
      }
      groups.push(group)
    }
    group.items.push(item)
    group.totalValue += Number(item.totalValueInBirr)
  })
  
  return groups
})

const donationStats = computed(() => [
  { key: 'total', label: 'Total Batch Value', value: donation.value?.totalValueInBirr || 0, format: 'currency', color: '#6a11cb' },
  { key: 'items', label: 'Total Line Items', value: donation.value?.items?.length || 0, color: '#3b82f6' },
  { key: 'delivered', label: 'Delivered Items', value: donation.value?.items?.filter(i => i.isDelivered).length || 0, color: '#10b981' }
])

const toggleGroup = (id: number) => {
  const idx = expandedGroups.value.indexOf(id)
  if (idx > -1) expandedGroups.value.splice(idx, 1)
  else expandedGroups.value.push(id)
}

const formatCurrency = (v: number) => CharityService.formatCurrency(v)
const formatDate = (d: any) => CharityService.formatDate(d)

const submitForApproval = async () => {
  if (!confirm('Submit this donation batch for review?')) return
  processing.value = true
  const res = await CharityService.submitDonation(Number(donationId.value))
  if (res.success) loadDonation()
  processing.value = false
}

const approveBatch = async () => {
  if (!confirm('Approve this donation batch?')) return
  processing.value = true
  const res = await CharityService.approveDonation(Number(donationId.value))
  if (res.success) loadDonation()
  processing.value = false
}

const markDelivered = async (item: CharityDonationItem) => {
  if (!confirm(`Mark "${item.description}" as delivered?`)) return
  processing.value = true
  const res = await CharityService.updateDonationItem(item.donationItemId, { isDelivered: true })
  if (res.success) loadDonation()
  processing.value = false
}

const addItem = () => router.push(`/charity/donations/${donationId.value}/edit`)
const editItem = (item: CharityDonationItem) => router.push(`/charity/donations/${donationId.value}/edit`)

onMounted(loadDonation)
</script>

<style scoped>
.donation-detail-page { padding: 32px; background: #f8fafc; min-height: 100vh; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.header-left { display: flex; align-items: center; gap: 20px; }
.back-btn { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 12px; color: #64748b; text-decoration: none; transition: all 0.2s; }
.back-btn:hover { border-color: #6a11cb; color: #6a11cb; box-shadow: 0 4px 12px rgba(106, 17, 203, 0.1); }
.page-title { font-size: 26px; font-weight: 800; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.team-label, .date-label { font-weight: 700; color: #334155; }
.separator { color: #cbd5e1; }

.header-actions { display: flex; align-items: center; gap: 16px; }
.status-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
.status-pill.draft { background: #f1f5f9; color: #475569; }
.status-pill.pending { background: #fef3c7; color: #b45309; }
.status-pill.approved { background: #dcfce7; color: #166534; }

.btn-primary { padding: 10px 24px; border-radius: 10px; background: linear-gradient(135deg, #6a11cb, #7c3aed); color: white; border: none; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.btn-primary.success { background: #10b981; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; margin-top: 32px; }
@media (max-width: 1100px) { .detail-grid { grid-template-columns: 1fr; } }

.section-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
.section-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.section-header h3 { font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; }
.btn-secondary { padding: 8px 16px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; }

.beneficiary-groups { display: flex; flex-direction: column; }
.ben-group-card { border-bottom: 1px solid #f1f5f9; }
.ben-group-card:last-child { border-bottom: none; }

.ben-group-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; }
.ben-group-header:hover { background: #fcfcfd; }
.ben-info { display: flex; align-items: center; gap: 14px; }
.ben-avatar { width: 36px; height: 36px; border-radius: 12px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; }
.ben-meta { display: flex; flex-direction: column; }
.ben-name { font-size: 15px; font-weight: 700; color: #1e293b; }
.ben-type { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

.group-summary { display: flex; align-items: center; gap: 20px; }
.item-count { font-size: 13px; color: #64748b; }
.total-val { font-size: 15px; font-weight: 800; color: #10b981; }
.chevron { width: 20px; height: 20px; color: #cbd5e1; transition: transform 0.3s; }
.chevron.open { transform: rotate(180deg); color: #6a11cb; }

.ben-items-list { background: #fafcfd; padding: 12px 24px 24px; border-top: 1px solid #f1f5f9; }
.item-row { background: white; border: 1px solid #eef2f6; border-radius: 16px; margin-bottom: 12px; overflow: hidden; }
.item-row:last-child { margin-bottom: 0; }

.item-main { padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.item-desc { flex: 1; }
.item-desc strong { display: block; font-size: 14px; color: #334155; margin-bottom: 6px; }
.item-pills { display: flex; gap: 8px; }
.type-pill { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
.type-pill.money { background: #e0f2fe; color: #0369a1; }
.type-pill.goods { background: #dcfce7; color: #15803d; }
.type-pill.service { background: #fef3c7; color: #a16207; }
.recurring-pill { background: #f5f3ff; color: #6d28d9; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }

.item-vals { display: flex; gap: 24px; }
.val-box { display: flex; flex-direction: column; align-items: flex-end; }
.val-box small { font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
.val-box span { font-size: 14px; font-weight: 600; color: #475569; }
.val-box.total span { color: #10b981; font-weight: 800; }

.item-actions { display: flex; gap: 8px; }
.action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #6a11cb; color: #6a11cb; background: #f5f3ff; }
.action-btn.success:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }

.recurring-periods { background: #f8faff; border-top: 1px solid #eef2f6; padding: 12px 16px; }
.periods-header { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.periods-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.period-chip { display: flex; align-items: center; gap: 8px; padding: 4px 10px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; }
.period-chip.delivered { border-color: #10b981; background: #f0fdf4; }
.p-id { font-weight: 800; color: #94a3b8; }
.p-val { font-weight: 700; color: #475569; }
.p-check { color: #10b981; font-weight: 900; }

.side-info { display: flex; flex-direction: column; gap: 24px; }
.info-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.info-card h3 { font-size: 16px; font-weight: 800; color: #1e293b; margin: 0 0 20px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
.info-list { display: flex; flex-direction: column; gap: 16px; }
.info-item { display: flex; justify-content: space-between; align-items: center; }
.info-item label { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
.info-item span { font-size: 14px; font-weight: 700; color: #475569; }

.description p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0; }

.loading-state { text-align: center; padding: 100px; }
.spinner { width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top-color: #6a11cb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-items { text-align: center; padding: 60px 24px; color: #94a3b8; }
</style>
