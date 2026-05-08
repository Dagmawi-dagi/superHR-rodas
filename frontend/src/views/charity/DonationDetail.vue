<template>
  <div class="donation-detail" v-if="donation">
    <!-- Back header -->
    <div class="page-header">
      <router-link to="/charity/donations" class="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </router-link>
      <div>
        <h1 class="page-title">Donation #{{ donation.donationId }}</h1>
        <p class="page-subtitle">
          {{ donation.DonationCompany?.name }} → {{ donation.Campaign?.title }}
        </p>
      </div>
      <div class="header-actions">
        <StatusBadge :status="donation.status" />
        <button v-if="canSubmit" @click="submitDonation" class="btn-primary" :disabled="submitting">Submit for Approval</button>
        <button v-if="canApprove" @click="approveDonation" class="btn-primary" :disabled="approving">Approve</button>
        <button v-if="canApprove" @click="showRequestChangesModal = true" class="btn-warning" :disabled="submittingChanges">Request Changes</button>
        <button v-if="canDistribute" @click="markDistributed" class="btn-primary" :disabled="distributing"> {{distributing? 'Distributing':'Mark Distributed'}} </button>
        <button v-if="canCancel" @click="openCancelModal" class="btn-danger" :disabled="canceling">Cancel Donation</button>
      </div>
    </div>

    <!-- Donation Summary -->
    <div class="summary-card">
      <div class="summary-row">
        <div class="summary-item">
          <span class="label">DonationCompany</span>
          <span class="value">{{ donation.DonationCompany?.name }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Campaign</span>
          <span class="value">{{ donation.Campaign?.title }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Date</span>
          <span class="value">{{ formatDate(donation.donationDate) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Total Value</span>
          <span class="value">{{ formatCurrency(donation.totalValue) }}</span>
        </div>
        <div class="summary-item" v-if="donation.status === 'approved'">
          <span class="label">Returned</span>
          <span class="value">{{ formatCurrency(returnedAmount) }}</span>
        </div>
        <div class="summary-item" v-if="donation.status === 'approved'">
          <span class="label">Distributed (Active)</span>
          <span class="value">{{ formatCurrency(donation.totalValue - unassignedAmount) }}</span>
        </div>
        <div class="summary-item" v-if="donation.status === 'approved'">
          <span class="label">Unassigned</span>
          <span class="value">{{ formatCurrency(unassignedAmount) }}</span>
        </div>
      </div>
      <div class="summary-notes" v-if="donation.notes">
        <span class="label">Notes</span>
        <p>{{ donation.notes }}</p>
      </div>
    </div>

    <!-- Items Section -->
    <div class="section-card">
      <div class="section-header">
        <h3>Donation Items</h3>
        <button v-if="donation.status === 'draft'" @click="openAddItemModal" class="btn-secondary">+ Add Item</button>
      </div>

      <table class="items-table" v-if="items.length">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Qty/Amount</th>
            <th>Unit Value</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Recurring</th>
            <th>Recurring Data</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="item in items" :key="item.donationItemId">
            <tr>
              <td><span :class="['type-badge', `type-${item.type}`]">{{ getTypeLabel(item.type) }}</span></td>
              <td>{{ item.description || '-' }}</td>
              <td>
                <span v-if="item.type === 'money'">{{ formatCurrency(item.totalValue) }}</span>
                <span v-else>{{ item.quantity }}</span>
              </td>
              <td>
                <span v-if="item.type === 'money'">-</span>
                <span v-else>{{ formatCurrency(item.unitValue) }}</span>
              </td>
              <td class="total-cell">{{ formatCurrency(item.totalValue) }}</td>
              <td>{{ item.type === 'money' ? (item.paymentMethod || 'bank') : '-' }}</td>
              
              <!-- Recurring? -->
              <td>
                <div v-if="item.isRecurring" style="text-transform: capitalize;">
                  ✓ {{ item.DonationItemIntervals?.length }} {{ item.DonationItemIntervals?.[0]?.intervalType?.replace('ly', 's') }}
                </div>
                <span v-else>-</span>
              </td>
              <!-- Recurring Data -->
              <td style="font-size: 11px">
                <div v-if="item.isRecurring && item.DonationItemIntervals?.length">
                  {{ formatDate(item.DonationItemIntervals[0].startDate) }} - {{ formatDate(item.DonationItemIntervals[item.DonationItemIntervals.length - 1].endDate) }}
                </div>
                <span v-else>-</span>
              </td>

              <td class="actions-cell">
                <!-- Upload Evidence (only for non-recurring or at item level) -->
                <button
                  v-if="donation?.status === 'approved' && !item.isRecurring"
                  @click="openEvidenceModalForItem(item)"
                  class="action-btn evidence"
                  title="Upload Evidence"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                
                <!-- Evidence warning (exclamation mark) - Always show if missing (non-recurring only) -->
                <span v-if="!item.isRecurring && !item.DonationDistributionEvidences?.length && item.status !== 'distributed' && donation.status === 'approved'"  
                      class="evidence-warning" 
                      title="Evidence required">
                  ⚠️  
                </span>

                <!-- Mark Item Distributed (only for non-recurring) -->
                <button
                  v-if="donation?.status === 'approved' && item.status !== 'distributed' && !item.isRecurring"
                  @click="markItemAsDistributed(item)"
                  class="action-btn distribute-item"
                  :title="(!item.DonationDistributionEvidences?.length) ? 'Upload evidence first' : 'Mark Item Distributed'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                  </svg>
                </button>
                <span v-if="item.status === 'distributed'" class="distributed-badge" title="Distributed">✓</span>

                <!-- Edit item (draft only) -->
                <button v-if="donation?.status === 'draft'" @click="openEditItemModal(item)" class="action-btn edit" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>

                <!-- Delete item (draft only) -->
                <button v-if="donation?.status === 'draft'" @click="deleteItem(item)" class="action-btn delete" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>

                <!-- Toggle distribution view -->
                <button v-if="!item.isRecurring" class="action-btn toggle-dist" @click="toggleDistributions(item.donationItemId)" title="Show distribution">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" v-if="!expandedItems.includes(item.donationItemId)" />
                    <path d="M6 9l6 6 6-6" v-else />
                  </svg>
                </button>

                <!-- Toggle intervals view (only for recurring items) -->
                <button v-if="item.isRecurring" class="action-btn toggle-interval" @click="toggleIntervalView(item.donationItemId)" title="View Intervals">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6" v-if="!expandedIntervals.includes(item.donationItemId)" />
                    <path d="M6 9l6 6 6-6" v-else />
                  </svg>
                </button>

                <!-- Evidence display (non-recurring only) -->
                <div v-if="!item.isRecurring && item.DonationDistributionEvidences?.length" class="evidence-container">
                  <button @click="toggleEvidence(item.donationItemId)" class="action-btn evidence" title="View Evidence">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                    </svg>
                  </button>
                  <div v-if="expandedEvidence.includes(item.donationItemId)" class="evidence-list">
                    <a
                      v-for="ev in item.DonationDistributionEvidences"
                      :key="ev.evidenceId"
                      :href="getFileUrl(ev.fileUrl)"
                      target="_blank"
                      class="evidence-item"
                    >
                      {{ ev.fileName }}
                    </a>
                  </div>
                </div>
              </td>

            </tr>
            <!-- Distribution details (expandable) -->
            <tr v-if="expandedItems.includes(item.donationItemId)">
              <td colspan="11" class="dist-detail-cell">
                <div class="dist-detail">
                  <div class="dist-header">
                    <h4>Assigned Beneficiaries</h4>
                    <div class="view-toggle">
                      <button
                        :class="['toggle-btn', { active: (distViewMode[item.donationItemId] || 'individual') === 'individual' }]"
                        @click="toggleDistView(item.donationItemId, 'individual')">
                        Individual
                      </button>
                      <button
                        :class="['toggle-btn', { active: (distViewMode[item.donationItemId] || 'individual') === 'group' }]"
                        @click="toggleDistView(item.donationItemId, 'group')">
                        By Group
                      </button>
                    </div>
                  </div>

                  <!-- Individual view -->
                  <div v-if="(distViewMode[item.donationItemId] || 'individual') === 'individual'">
                    <div v-if="summaryDistributions(item).length">
                      <table class="mini-table">
                        <thead>
                          <tr>
                            <th>Beneficiary</th>
                            <th>{{ item.type === 'money' ? 'Amount' : 'Quantity' }}</th>
                            <th>Value</th>
                            <th>Returned</th>
                            <th>Reassigned/Deducted</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="dist in summaryDistributions(item)" :key="dist.distributionId">
                            <td>{{ dist.Beneficiary?.name || 'Unknown' }} ({{ dist.Beneficiary?.type }})</td>
                            <td>{{ item.type === 'money' ? formatCurrency(dist.value) : dist.quantity }}</td>
                            <td>{{ formatCurrency(dist.value) }}</td>
                            <td>
                              <span v-if="dist.isReturned" class="returned">Yes ({{ dist.returnReason }})</span>
                              <span v-else class="active-dist">No</span>
                            </td>
                            <td>
                                <div v-if="getReassignHistory(item, dist.distributionId).length" class="history-list">
                                  <div v-for="h in getReassignHistory(item, dist.distributionId)" :key="h.deductionId" class="history-item tooltip-container">
                                    <span v-if="h.fromBeneficiaryId === dist.beneficiaryId" class="hist-out">
                                      <template v-if="item.type === 'money'">
                                        -{{ formatCurrency(h.amount) }}
                                        {{ h.reassignedTo ? `→ ${h.reassignedTo.name}` : '' }}
                                      </template>
                                      <template v-else>
                                        -{{ (h.amount / (item.unitValue || 1)).toFixed(2) }} ({{ formatCurrency(h.amount) }})
                                        {{ h.reassignedTo ? `→ ${h.reassignedTo.name}` : '' }}
                                      </template>
                                    </span>
                                    <span v-else class="hist-in">
                                      <template v-if="item.type === 'money'">
                                        +{{ formatCurrency(h.amount) }}
                                        from {{ h.fromBeneficiary?.name || 'Pool' }}
                                      </template>
                                      <template v-else>
                                        +{{ (h.amount / (item.unitValue || 1)).toFixed(2) }} ({{ formatCurrency(h.amount) }})
                                        from {{ h.fromBeneficiary?.name || 'Pool' }}
                                      </template>
                                    </span>
                                    <div class="tooltip-content" v-if="h.reason">
                                      <strong>Reason:</strong><br/>
                                      {{ h.reason }}
                                    </div>
                                  </div>
                                </div>
                                <span v-else>-</span>
                            </td>
                            <td>
                              <span v-if="!dist.isReturned && donation?.status === 'approved'">
                                  <button
                                    @click="openReturnModal(dist)"
                                    class="return-btn"
                                    title="Mark as returned"
                                  >
                                    ↩ Return
                                  </button>
                                  <button
                                    v-if="item.status !== 'distributed'"
                                    @click="openReassignModal(dist, item)"
                                    class="reassign-btn"
                                    title="Reassign / Deduct"
                                  >
                                    ⇄ Reassign
                                  </button>
                              </span>
                              <span v-else>-</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div class="unassigned" v-if="item.type === 'money' && item.unassignedDeduction > 0">
                        <em>Unassigned deduction: {{ formatCurrency(item.unassignedDeduction) }}</em>
                      </div>
                    </div>
                    <p v-else class="no-dist">No beneficiaries assigned yet.</p>
                  </div>

                  <!-- Group view -->
                  <div v-else>
                    <div v-if="item.DonationDistributions && item.DonationDistributions.length">
                      <table class="mini-table">
                        <thead>
                          <tr>
                            <th>Group</th>
                            <th>{{ item.type === 'money' ? 'Total Amount' : 'Total Quantity' }}</th>
                            <th>Total Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(group, groupId) in groupedDistributions(item)" :key="groupId">
                            <td>{{ getGroupName(groupId) }}</td>
                            <td>{{ item.type === 'money' ? formatCurrency(group.totalValue) : group.totalQuantity }}</td>
                            <td>{{ formatCurrency(group.totalValue) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p v-else class="no-dist">No beneficiaries assigned yet.</p>
                  </div>
                </div>
              </td>
            </tr>
            <!-- Interval details (new) -->
            <tr v-if="expandedIntervals.includes(item.donationItemId) && item.isRecurring">
              <td colspan="9" class="interval-detail-cell">
                <div class="interval-detail">
                  <h4>Recurring Intervals</h4>
                  <div v-if="item.DonationItemIntervals?.length">
                    <div v-for="interval in item.DonationItemIntervals" :key="interval.intervalId" class="interval-wrapper">
                      <div class="interval-row">
                        <span class="interval-info">
                          <strong style="text-transform: capitalize;">{{ interval.intervalType?.replace('ly', '') }} {{ interval.intervalCount }} ({{ formatDate(interval.startDate) }}):</strong> 
                          – <span :class="['status-badge', `status-${interval.status}`]">{{ interval.status }}</span>
                        </span>
                        
                        <div class="interval-actions">
                          <button class="btn-sm" @click="toggleIntervalDistributions(interval.intervalId)">
                            {{ expandedIntervalDists.includes(interval.intervalId) ? 'Hide' : 'View' }} Beneficiaries
                          </button>
                          
                          <!-- Interval Evidence icon -->
                          <button
                            v-if="donation?.status === 'approved'"
                            @click="openIntervalEvidenceModal(interval, item)"
                            class="action-btn evidence"
                            title="Upload Evidence"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>

                          <!-- Interval Evidence View icon -->
                          <div v-if="hasIntervalEvidence(item, interval.intervalId)" class="evidence-container">
                            <button @click="toggleIntervalEvidence(interval.intervalId)" class="action-btn evidence" title="View Evidence">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                              </svg>
                            </button>
                            <div v-if="expandedIntervalEvidence.includes(interval.intervalId)" class="evidence-list">
                              <a
                                v-for="ev in getIntervalEvidences(item, interval.intervalId)"
                                :key="ev.evidenceId"
                                :href="getFileUrl(ev.fileUrl)"
                                target="_blank"
                                class="evidence-item"
                              >
                                {{ ev.fileName }}
                              </a>
                            </div>
                          </div>

                          <!-- Interval Distribute icon -->
                          <span v-if="interval.status !== 'distributed' && donation.status === 'approved' && !hasIntervalEvidence(item, interval.intervalId)"
                                class="evidence-warning"
                                title="Upload evidence for this period first">
                            ⚠️
                          </span>

                          <button
                            v-if="donation?.status === 'approved' && interval.status !== 'distributed'"
                            @click="markIntervalAsDistributed(interval, item)"
                            class="action-btn distribute-item"
                            :title="!hasIntervalEvidence(item, interval.intervalId) ? 'Upload evidence for this period first' : 'Distribute for this period'"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <!-- Per-interval distribution list -->
                      <div v-if="expandedIntervalDists.includes(interval.intervalId)" class="interval-dists">
                        <div class="dist-header">
                          <h5 class="dist-title">Assigned Beneficiaries for {{ interval.startDate }} to {{ interval.endDate }}</h5>
                          <div class="view-toggle">
                            <button
                              :class="['toggle-btn', { active: (intervalDistViewMode[interval.intervalId] || 'individual') === 'individual' }]"
                              @click="toggleIntervalDistView(interval.intervalId, 'individual')">
                              Individual
                            </button>
                            <button
                              :class="['toggle-btn', { active: (intervalDistViewMode[interval.intervalId] || 'individual') === 'group' }]"
                              @click="toggleIntervalDistView(interval.intervalId, 'group')">
                              By Group
                            </button>
                          </div>
                        </div>

                        <!-- Individual view -->
                        <div v-if="(intervalDistViewMode[interval.intervalId] || 'individual') === 'individual'">
                          <div v-if="getIntervalDistributions(item, interval.intervalId).length">
                            <table class="mini-table">
                              <thead>
                                <tr>
                                  <th>Beneficiary</th>
                                  <th>{{ item.type === 'money' ? 'Amount' : 'Quantity' }}</th>
                                  <th>Value</th>
                                  <th>Returned</th>
                                  <th>Reassigned/Deducted</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="dist in getIntervalDistributions(item, interval.intervalId)" :key="dist.distributionId">
                                  <td>{{ dist.Beneficiary?.name || 'Unknown' }}</td>
                                  <td>{{ item.type === 'money' ? formatCurrency(dist.value) : dist.quantity }}</td>
                                  <td>{{ formatCurrency(dist.value) }}</td>
                                  <td>
                                    <span v-if="dist.isReturned" class="returned">Yes ({{ dist.returnReason }})</span>
                                    <span v-else class="active-dist">No</span>
                                  </td>
                                  <td>
                                      <div v-if="getReassignHistory(item, dist.distributionId).length" class="history-list">
                                        <div v-for="h in getReassignHistory(item, dist.distributionId)" :key="h.deductionId" class="history-item tooltip-container">
                                    <span v-if="h.fromBeneficiaryId === dist.beneficiaryId" class="hist-out">
                                      <template v-if="item.type === 'money'">
                                        -{{ formatCurrency(h.amount) }}
                                        {{ h.reassignedTo ? `→ ${h.reassignedTo.name}` : '' }}
                                      </template>
                                      <template v-else>
                                        -{{ (h.amount / (item.unitValue || 1)).toFixed(2) }} ({{ formatCurrency(h.amount) }})
                                        {{ h.reassignedTo ? `→ ${h.reassignedTo.name}` : '' }}
                                      </template>
                                    </span>
                                    <span v-else class="hist-in">
                                      <template v-if="item.type === 'money'">
                                        +{{ formatCurrency(h.amount) }}
                                        from {{ h.fromBeneficiary?.name || 'Pool' }}
                                      </template>
                                      <template v-else>
                                        +{{ (h.amount / (item.unitValue || 1)).toFixed(2) }} ({{ formatCurrency(h.amount) }})
                                        from {{ h.fromBeneficiary?.name || 'Pool' }}
                                      </template>
                                    </span>
                                          <div class="tooltip-content" v-if="h.reason">
                                            <strong>Reason:</strong><br/>
                                            {{ h.reason }}
                                          </div>
                                        </div>
                                      </div>
                                      <span v-else>-</span>
                                  </td>
                                  <td>
                                    <span v-if="!dist.isReturned && donation?.status === 'approved'">
                                      <button
                                        @click="openReturnModal(dist)"
                                        class="return-btn"
                                        title="Mark as returned"
                                      >
                                        ↩ Return
                                      </button>
                                      <button
                                        v-if="interval.status !== 'distributed'"
                                        @click="openReassignModal(dist, item)"
                                        class="reassign-btn"
                                        title="Reassign / Deduct"
                                      >
                                        ⇄ Reassign
                                      </button>
                                    </span>
                                    <span v-else>-</span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <div class="unassigned" v-if="getIntervalUnassigned(item, interval.intervalId) > 0">
                              <em>Unassigned deduction for this period: {{ item.type === 'money' ? formatCurrency(getIntervalUnassigned(item, interval.intervalId)) : (getIntervalUnassigned(item, interval.intervalId) / (item.unitValue || 1)).toFixed(2) + ' (' + formatCurrency(getIntervalUnassigned(item, interval.intervalId)) + ')' }}</em>
                            </div>
                          </div>
                          <p v-else class="no-dist">No beneficiaries assigned for this month.</p>
                        </div>

                        <!-- Group view -->
                        <div v-else>
                          <div v-if="getIntervalDistributions(item, interval.intervalId).length">
                            <table class="mini-table">
                              <thead>
                                <tr>
                                  <th>Group</th>
                                  <th>{{ item.type === 'money' ? 'Total Amount' : 'Total Quantity' }}</th>
                                  <th>Total Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr v-for="(group, groupId) in getGroupedDistributions(getIntervalDistributions(item, interval.intervalId))" :key="groupId">
                                  <td>{{ getGroupName(groupId) }}</td>
                                  <td>{{ item.type === 'money' ? formatCurrency(group.totalValue) : group.totalQuantity }}</td>
                                  <td>{{ formatCurrency(group.totalValue) }}</td>
                                </tr>
                              </tbody>
                            </table>
                            <div class="unassigned" v-if="getIntervalUnassigned(item, interval.intervalId) > 0">
                              <em>Unassigned deduction for this period: {{ item.type === 'money' ? formatCurrency(getIntervalUnassigned(item, interval.intervalId)) : (getIntervalUnassigned(item, interval.intervalId) / (item.unitValue || 1)).toFixed(2) + ' (' + formatCurrency(getIntervalUnassigned(item, interval.intervalId)) + ')' }}</em>
                            </div>
                          </div>
                          <p v-else class="no-dist">No beneficiaries assigned for this month.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p v-else>No intervals defined.</p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-else class="empty-items">
        <p>No items yet. Add some items to proceed.</p>
      </div>
    </div>

    <!-- Status Transition Modals -->
    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeCancelModal">
      <div class="modal">
        <h3>Cancel Donation</h3>
        <p>Are you sure you want to cancel this donation?</p>
        <div class="modal-actions">
          <button @click="closeCancelModal" class="btn-secondary">No</button>
          <button @click="cancelDonation" class="btn-danger" :disabled="canceling">Yes, Cancel</button>
        </div>
      </div>
    </div>

    <!-- Request Changes Modal -->
    <div v-if="showRequestChangesModal" class="modal-overlay" @click.self="showRequestChangesModal = false">
      <div class="modal">
        <h3>Request Changes</h3>
        <p>Add a comment explaining what needs to be changed.</p>
        <textarea v-model="requestChangesComment" rows="3" placeholder="Your comment..."></textarea>
        <div class="modal-actions">
          <button @click="showRequestChangesModal = false" class="btn-secondary">Cancel</button>
          <button @click="submitRequestChanges" :disabled="!requestChangesComment.trim() || submittingChanges" class="btn-primary">
            {{ submittingChanges ? 'Sending...' : 'Send & Return to Draft' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Evidence Upload Modal (Combined) -->
    <EvidenceUploadModal
      :is-open="showEvidenceModal"
      :title="evidenceModalTitle"
      :uploading="uploadingEvidence"
      @close="showEvidenceModal = false; selectedItem = null; selectedInterval = null"
      @upload="handleEvidenceUpload"
    />

    <!-- Add/Edit Item Modals -->
    <AddItemModal
      v-if="showAddItemModal"
      :donation-id="donationId"
      :saving="savingItem"
      :item-to-edit="editingItem"
      @close="closeAddItemModal"
      @save="handleItemSave"
    />
    
    <DistributeItemModal
      v-if="showDistributeModal && distributingItem"
      :item="distributingItem"
      :beneficiaries="beneficiaries"
      :saving="distributingSaving"
      @close="showDistributeModal = false; distributingItem = null"
      @save="handleDistribute"
    />

    <ReassignDistributionModal
      :is-open="showReassignModal"
      :distribution="selectedDistForReassign"
      :item="selectedItemForReassign"
      @close="showReassignModal = false"
      @success="loadDonation(); addToast('Distribution updated successfully')"
    />

    <!-- Return Distribution Modal -->
    <div v-if="showReturnModal" class="modal-overlay" @click.self="showReturnModal = false">
      <div class="modal">
        <h3>Return Distribution</h3>
        <div class="warning-box" style="margin-bottom: 12px; background: #fff7ed; border-left: 4px solid #f97316; padding: 8px;">
          <p style="color: #9a3412; font-size: 12px; margin: 0;">
            <strong>⚠️ Warning:</strong> Consider using Reassign/Deduct instead. Returning a distribution is permanent and cannot be undone.
          </p>
        </div>
        <p>Enter the reason for returning this distribution.</p>
        <textarea v-model="returnReason" rows="3" placeholder="Reason..."></textarea>
        <div class="modal-actions">
          <button @click="showReturnModal = false" class="btn-secondary">Cancel</button>
          <button @click="confirmReturn" :disabled="!returnReason.trim() || returning" class="btn-primary">
            {{ returning ? 'Saving...' : 'Confirm Return' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', `toast-${toast.type}`]" @click="removeToast(toast.id)">
        {{ toast.message }}
      </div>
    </div>
  </div>
  <div v-else class="loading-state">
    <div class="spinner"></div>
    <p>Loading donation...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CharityService from '@/stores/charity'
import { useAuthStore } from '@/stores/auth'
import StatusBadge from './components/DonationItem/StatusBadge.vue'
import AddItemModal from './components/DonationItem/AddItemModal.vue'
import DistributeItemModal from './components/Donation/DistributeItemModal.vue'
import ReassignDistributionModal from './components/Donation/ReassignDistributionModal.vue'
import EvidenceUploadModal from './components/Donation/EvidenceUploadModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const donationId = parseInt(route.params.id)
const donation = ref(null)
const items = computed(() => donation.value?.DonationItems || [])
const loading = ref(false)
const submitting = ref(false)
const approving = ref(false)
const distributing = ref(false)
const canceling = ref(false)
const savingItem = ref(false)

const showCancelModal = ref(false)
const showAddItemModal = ref(false)
const showEditItemModal = ref(false)
const editingItem = ref(null)

const toasts = ref([])
const expandedItems = ref([])
const expandedIntervals = ref([])
const expandedIntervalDists = ref([])

const showRequestChangesModal = ref(false)
const requestChangesComment = ref('')
const submittingChanges = ref(false)

// Evidence modal state (Unified)
const showEvidenceModal = ref(false)
const selectedItem = ref(null)
const selectedInterval = ref(null)
const uploadingEvidence = ref(false)

const evidenceModalTitle = computed(() => {
  if (selectedInterval.value) {
    return `${selectedInterval.value.intervalType} - ${formatDate(selectedInterval.value.startDate)}`
  }
  return selectedItem.value?.description || 'Item'
})

const handleEvidenceUpload = async (files) => {
  if (!files.length) return
  uploadingEvidence.value = true
  const formData = new FormData()
  files.forEach(file => formData.append('documents', file))
  
  try {
    let res
    if (selectedInterval.value) {
      res = await CharityService.uploadIntervalEvidence(
        selectedItem.value.donationItemId, 
        selectedInterval.value.intervalId, 
        formData
      )
    } else {
      res = await CharityService.uploadItemEvidence(
        selectedItem.value.donationItemId, 
        formData
      )
    }

    if (res.success) {
      addToast('Evidence uploaded successfully')
      showEvidenceModal.value = false
      selectedItem.value = null
      selectedInterval.value = null
      loadDonation()
    } else {
      addToast(res.error || 'Upload failed', 'error')
    }
  } finally {
    uploadingEvidence.value = false
  }
}

const beneficiaries = ref([])
const showDistributeModal = ref(false)
const distributingItem = ref(null)
const distributingSaving = ref(false)

const groups = ref([])

// ── Interval state ──
const showIntervalDistModal = ref(false)
const distributionDate = ref('')
const distributingInterval = ref(false)
const intervalDistRows = ref([])

// ── Return distribution state ──
const showReturnModal = ref(false)
const returningDist = ref(null)
const returnReason = ref('')
const returning = ref(false)

// ── Reassign distribution state ──
const showReassignModal = ref(false)
const selectedDistForReassign = ref(null)
const selectedItemForReassign = ref(null)

const openReassignModal = (dist, item) => {
  selectedDistForReassign.value = dist
  selectedItemForReassign.value = item
  showReassignModal.value = true
}

// ── Helper functions ──
const addToast = (msg, type='success') => {
  const id = Date.now()
  toasts.value.push({ id, message: msg, type })
  setTimeout(() => removeToast(id), 5000)
}
const removeToast = (id) => toasts.value = toasts.value.filter(t => t.id !== id)

const formatDate = (d) => {
  if (!d) return 'N/A'
  const date = new Date(d)
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return `${months[date.getMonth()]}-${date.getDate()}-${date.getFullYear()}`
}
const formatCurrency = (v) => v ? new Intl.NumberFormat('en-US',{style:'currency',currency:'ETB'}).format(v) : '0.00'
const getTypeLabel = (t) => ({ money:'Money', goods:'Goods', service:'Service' })[t] || t
const getFileUrl = (relativePath) => {
  if (!relativePath) return '#';
  if (relativePath.startsWith('http')) return relativePath;
  const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  return `${BACKEND_BASE}${relativePath}`;
}
const expandedEvidence = ref([]);
const toggleEvidence = (itemId) => {
  const idx = expandedEvidence.value.indexOf(itemId);
  if (idx > -1) expandedEvidence.value.splice(idx, 1);
  else expandedEvidence.value.push(itemId);
}

// ── Computed: total returned amount ──
const returnedAmount = computed(() => {
  if (!donation.value?.DonationItems) return 0;
  let total = 0;
  donation.value.DonationItems.forEach(item => {
    item.DonationDistributions?.forEach(dist => {
      if (dist.isReturned) total += parseFloat(dist.value || 0);
    });
  });
  return total;
});

const unassignedAmount = computed(() => {
  if (!donation.value?.DonationItems) return 0;
  return donation.value.DonationItems.reduce((acc, item) => {
    return acc + parseFloat(item.unassignedDeduction || 0);
  }, 0);
});

const canSubmit = computed(() => donation.value?.status === 'draft')
const canApprove = computed(() => donation.value?.status === 'pending' && ['admin','finance','charity'].includes(authStore.user?.role))
const canDistribute = computed(() => donation.value?.status === 'approved')
const canCancel = computed(() => donation.value?.status !== 'cancelled')

const toggleIntervalDistributions = (intervalId) => {
  const idx = expandedIntervalDists.value.indexOf(intervalId)
  if (idx > -1) expandedIntervalDists.value.splice(idx, 1)
  else expandedIntervalDists.value.push(intervalId)
}

const getIntervalDistributions = (item, intervalId) => {
  if (!item.DonationDistributions) return []
  // Show only distributions specific to this interval
  const filtered = item.DonationDistributions.filter(d => String(d.intervalId) === String(intervalId))
  // Sort by created_at descending (newest first)
  return [...filtered].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

const hasIntervalEvidence = (item, intervalId) => {
  if (!item.DonationDistributionEvidences) return false
  return item.DonationDistributionEvidences.some(ev => String(ev.intervalId) === String(intervalId))
}

const getIntervalEvidences = (item, intervalId) => {
  if (!item.DonationDistributionEvidences) return []
  return item.DonationDistributionEvidences.filter(ev => String(ev.intervalId) === String(intervalId))
}

const expandedIntervalEvidence = ref([]);
const toggleIntervalEvidence = (intervalId) => {
  const idx = expandedIntervalEvidence.value.indexOf(intervalId);
  if (idx > -1) expandedIntervalEvidence.value.splice(idx, 1);
  else expandedIntervalEvidence.value.push(intervalId);
}

// Helper to filter main table (only show non-interval distributions for recurring items)
const summaryDistributions = (item) => {
  if (!item.DonationDistributions) return []
  let filtered = item.DonationDistributions
  if (item.isRecurring) {
    filtered = item.DonationDistributions.filter(d => d.intervalId === null)
  }
  // Sort by created_at descending (newest first)
  return [...filtered].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

const getReassignHistory = (item, distId) => {
  if (!item.DonationDeductions) return []
  const dist = item.DonationDistributions?.find(d => d.distributionId === distId)
  if (!dist) return []

  return item.DonationDeductions.filter(d => {
    // 1. Deduction was from THIS specific distribution (matches exactly)
    if (d.distributionId === distId) return true
    
    // 2. Deduction was reassigned TO THIS beneficiary in THIS specific interval
    // We check both beneficiaryId and intervalId to ensure it belongs to this period
    if (d.reassignedToBeneficiaryId === dist.beneficiaryId && String(d.intervalId) === String(dist.intervalId)) {
      return true
    }
    
    return false
  })
}

// ── Data loading ──
const loadDonation = async () => {
  loading.value = true
  const res = await CharityService.getDonationById(donationId)
  if (res.success) donation.value = res.data
  else addToast('Failed to load donation', 'error')
  loading.value = false
}

const loadDependencies = async () => {
  const bens = await CharityService.getBeneficiaries()
  if (bens.success) beneficiaries.value = bens.data
}

const loadGroups = async () => {
  const res = await CharityService.getBeneficiaryGroups()
  if (res.success) groups.value = res.data
}

// ── Status transitions (donation level) ──
const submitDonation = async () => {
  submitting.value = true
  const res = await CharityService.submitDonation(donationId)
  if (res.success) { addToast('Donation submitted for approval'); loadDonation() }
  else addToast(res.error || 'Submit failed', 'error')
  submitting.value = false
}

const approveDonation = async () => {
  approving.value = true
  const res = await CharityService.approveDonation(donationId)
  if (res.success) { addToast('Donation approved'); loadDonation() }
  else addToast(res.error || 'Approve failed', 'error')
  approving.value = false
}

const markDistributed = async () => {
  distributing.value = true
  const res = await CharityService.distributeDonation(donationId)
  if (res.success) { addToast('Marked as distributed'); loadDonation() }
  else addToast(res.error || 'Distribute failed', 'error')
  distributing.value = false
}

const openCancelModal = () => showCancelModal.value = true
const closeCancelModal = () => showCancelModal.value = false
const cancelDonation = async () => {
  canceling.value = true
  const res = await CharityService.cancelDonation(donationId)
  if (res.success) { addToast('Donation cancelled'); loadDonation(); closeCancelModal() }
  else addToast(res.error || 'Cancel failed', 'error')
  canceling.value = false
}

// ── Request changes ──
const submitRequestChanges = async () => {
  if (!requestChangesComment.value.trim()) return
  submittingChanges.value = true
  const res = await CharityService.requestChanges(donationId, requestChangesComment.value.trim())
  if (res.success) {
    addToast('Changes requested. Donation returned to draft.')
    showRequestChangesModal.value = false
    requestChangesComment.value = ''
    loadDonation()
  } else {
    addToast(res.error || 'Failed to request changes', 'error')
  }
  submittingChanges.value = false
}

// ── Items management ──
const openAddItemModal = () => {
  editingItem.value = null
  showAddItemModal.value = true
}
const openEditItemModal = (item) => {
  editingItem.value = { ...item }
  showAddItemModal.value = true
}
const closeAddItemModal = () => {
  showAddItemModal.value = false
  editingItem.value = null
}

const handleItemSave = async ({ itemData, distributions, interval }) => {
  savingItem.value = true
  try {
    if (editingItem.value) {
      // Update the item itself
      const updateRes = await CharityService.updateDonationItem(editingItem.value.donationItemId, itemData)
      if (!updateRes.success) {
        addToast(updateRes.error || 'Failed to update item', 'error')
        savingItem.value = false
        return
      }
      // Update interval (create/delete as needed)
      await CharityService.updateDonationItemInterval(editingItem.value.donationItemId, interval || null)
      // Replace distributions
      const deleteRes = await CharityService.deleteItemDistributions(editingItem.value.donationItemId)
      if (!deleteRes.success) {
        addToast('Failed to clear old distributions', 'error')
      }
      if (distributions.length > 0) {
        const distRes = await CharityService.distributeItem(editingItem.value.donationItemId, distributions)
        if (distRes.success) {
          addToast('Item updated successfully')
        } else {
          addToast('Item updated but distribution assignment failed: ' + distRes.error, 'warning')
        }
      } else {
        addToast('Item updated (no beneficiaries assigned)')
      }
    } else {
      // New item
      const res = await CharityService.addDonationItem(donationId, {
        ...itemData,
        interval: interval || undefined,
      })
      if (!res.success) {
        addToast(res.error || 'Failed to add item', 'error')
        savingItem.value = false
        return
      }
      const newItemId = res.data.donationItemId
      if (distributions.length > 0) {
        const distRes = await CharityService.distributeItem(newItemId, distributions)
        distRes.success ? addToast('Item added and beneficiaries assigned') : addToast('Item added but assignment failed: ' + distRes.error, 'warning')
      } else {
        addToast('Item added successfully')
      }
    }
    loadDonation()
  } catch (err) {
    addToast('Unexpected error', 'error')
  }
  savingItem.value = false
  closeAddItemModal()
}

const deleteItem = async (item) => {
  if (!confirm(`Delete item "${item.description}"?`)) return
  const res = await CharityService.deleteDonationItem(item.donationItemId)
  if (res.success) { addToast('Item deleted'); loadDonation() }
  else addToast(res.error || 'Delete failed', 'error')
}

// ── Distribution view toggle ──
const toggleDistributions = (itemId) => {
  const idx = expandedItems.value.indexOf(itemId)
  if (idx > -1) expandedItems.value.splice(idx, 1)
  else {
    expandedItems.value.push(itemId)
    if (!distViewMode.value[itemId]) distViewMode.value[itemId] = 'individual'
  }
}
const toggleDistView = (itemId, mode) => distViewMode.value[itemId] = mode
const distViewMode = ref({})
const intervalDistViewMode = ref({})

const toggleIntervalDistView = (intervalId, mode) => intervalDistViewMode.value[intervalId] = mode

// Generic helper to group any set of distributions
const getGroupedDistributions = (distributions) => {
  if (!distributions) return {}
  const groupsData = {}
  distributions.forEach(dist => {
    const beneficiary = dist.Beneficiary
    if (!beneficiary) return
    const gId = beneficiary.groupId || 'unassigned'
    if (!groupsData[gId]) { groupsData[gId] = { totalValue: 0, totalQuantity: 0 } }
    groupsData[gId].totalValue += parseFloat(dist.value || 0)
    groupsData[gId].totalQuantity += parseFloat(dist.quantity || 0)
  })
  return groupsData
}

// ── Grouped distributions (for main item group view) ──
const groupedDistributions = (item) => {
  return getGroupedDistributions(item.DonationDistributions)
}
const getGroupName = (groupId) => {
  if (!groupId || groupId === 'unassigned') return 'Unassigned'
  const group = groups.value.find(g => g.groupId === parseInt(groupId))
  if (!group) return 'Unassigned'
  const mgr = group.manager ? `${group.manager.firstName} ${group.manager.lastName}` : ''
  return mgr ? `${mgr} <${group.name}>` : group.name
}

// ── Distribute (bulk for approved donations) ──
const handleDistribute = async (payload) => {
  distributingSaving.value = true
  const res = await CharityService.distributeItem(distributingItem.value.donationItemId, payload)
  if (res.success) { addToast('Distributed successfully'); showDistributeModal.value = false; distributingItem.value = null; loadDonation() }
  else addToast(res.error || 'Distribution failed', 'error')
  distributingSaving.value = false
}

// ── Per-item evidence upload ──
const openEvidenceModalForItem = (item) => {
  selectedItem.value = item
  selectedInterval.value = null
  showEvidenceModal.value = true
}

// ── Per-item mark distributed ──
const markItemAsDistributed = async (item) => {
  if (!confirm(`Mark "${item.description}" as distributed?`)) return
  const res = await CharityService.markItemDistributed(item.donationItemId)
  if (res.success) { addToast('Item marked as distributed'); loadDonation() }
  else addToast(res.error || 'Failed', 'error')
}

// ── Mark Interval as Distributed ──
const markIntervalAsDistributed = async (interval, item) => {
  if (!confirm(`Mark period "${interval.startDate} to ${interval.endDate}" as distributed?`)) return
  distributingInterval.value = true
  const res = await CharityService.distributeItemForInterval(
    item.donationItemId,
    interval.intervalId,
    { distributions: [] } // Sending empty array to trigger "mark existing as distributed" logic in backend
  )
  distributingInterval.value = false
  if (res.success) {
    addToast('Interval marked as distributed')
    loadDonation()
  } else {
    addToast(res.error || 'Failed to mark interval as distributed', 'error')
  }
}

// ── Return distribution ──
const openReturnModal = (dist) => {
  returningDist.value = dist
  returnReason.value = ''
  showReturnModal.value = true
}
const confirmReturn = async () => {
  if (!returningDist.value || !returnReason.value.trim()) return
  returning.value = true
  const res = await CharityService.returnDistribution(
    returningDist.value.distributionId,
    returnReason.value.trim()
  )
  returning.value = false
  if (res.success) {
    addToast('Distribution marked as returned')
    showReturnModal.value = false
    loadDonation()
  } else {
    addToast(res.error || 'Failed to return distribution', 'error')
  }
}

// ── Interval toggle ──
const toggleIntervalView = (itemId) => {
  const idx = expandedIntervals.value.indexOf(itemId)
  if (idx > -1) expandedIntervals.value.splice(idx, 1)
  else expandedIntervals.value.push(itemId)
}

// ── Interval distribution ──
const openIntervalDistributionModal = (interval, item) => {
  selectedInterval.value = interval
  selectedItem.value = item // keep reference to item for evidence
  distributionDate.value = ''
  intervalDistRows.value = [{ beneficiaryId: '', quantity: 0 }]
  showIntervalDistModal.value = true
}

const addIntervalRow = () => intervalDistRows.value.push({ beneficiaryId: '', quantity: 0 })
const removeIntervalRow = (idx) => intervalDistRows.value.splice(idx, 1)

const submitIntervalDistribution = async () => {
  if (!selectedInterval.value || !distributionDate.value) return
  const payload = intervalDistRows.value.map(r => ({
    beneficiaryId: r.beneficiaryId,
    quantity: r.quantity,
  }))
  distributingInterval.value = true
  const res = await CharityService.distributeItemForInterval(
    selectedItem.value?.donationItemId,
    selectedInterval.value.intervalId,
    { distributions: payload }
  )
  distributingInterval.value = false
  if (res.success) {
    addToast('Distribution successful')
    showIntervalDistModal.value = false
    loadDonation()
  } else {
    addToast(res.error || 'Failed', 'error')
  }
}

// ── Interval evidence ──
const openIntervalEvidenceModal = (interval, item) => {
  selectedInterval.value = interval
  selectedItem.value = item
  showEvidenceModal.value = true
}

const getIntervalUnassigned = (item, intervalId) => {
  if (!item.DonationDeductions) return 0
  return item.DonationDeductions
    .filter(d => String(d.intervalId) === String(intervalId) && !d.reassignedToBeneficiaryId)
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
}

// ── Mount ──
onMounted(async () => {
  await loadDonation()
  await loadDependencies()
  await loadGroups()
})
</script>

<style scoped>
.donation-detail { padding: 16px; max-width: 1200px; margin: 0 auto; background: #f5f7fb; min-height: 100vh; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; color: #475569; text-decoration: none; }
.back-btn svg { width: 18px; height: 18px; }
.page-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }
.header-actions { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.btn-primary { padding: 8px 16px; border-radius: 10px; background: linear-gradient(135deg,#6a11cb,#7c3aed); color: white; border: none; cursor: pointer; font-weight: 500; }
.btn-danger { padding: 8px 16px; border-radius: 10px; background: #dc2626; color: white; border: none; cursor: pointer; }
.btn-secondary { padding: 6px 12px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; font-weight: 500; }
.summary-card { background: white; border-radius: 16px; padding: 16px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 16px; }
.summary-item { display: flex; flex-direction: column; }
.label { font-size: 12px; color: #94a3b8; }
.value { font-size: 16px; font-weight: 600; color: #1e293b; }
.summary-notes { margin-top: 12px; }
.summary-notes p { margin: 4px 0 0; color: #475569; }
.section-card { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-header h3 { margin: 0; font-size: 18px; }
.items-table { width: 100%; border-collapse: collapse; }
.items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #f1f5f9; }
.items-table th { background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
.type-badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.type-money { background: #dbeafe; color: #1e40af; }
.type-goods { background: #dcfce7; color: #166534; }
.type-service { background: #fef3c7; color: #92400e; }
.total-cell { font-weight: 600; }
.actions-cell { display: flex; gap: 6px; align-items: center; }
.action-btn { width: 28px; height: 28px; border-radius: 6px; display: flex; padding: 5px;align-items: center; justify-content: center; cursor: pointer; border: none; background: none; color: #64748b; }
.action-btn.edit { background: #3b82f620; color: #3b82f6; }
.action-btn.delete { background: #ef444420; color: #dc2626; }
.action-btn.evidence { color: #8b5cf6; }
.action-btn.distribute-item { color: #10b981; }
.distributed-badge { color: #10b981; font-size: 18px; margin-left: 4px; }
.evidence-count { font-size: 12px; color: #6a11cb; margin-left: 4px; }
.empty-items { text-align: center; padding: 20px; color: #94a3b8; }
.modal-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index:1000; }
.modal { background: white; border-radius: 16px; padding: 24px; width: 400px; max-width: 90%; }
.modal h3 { margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
.toast-container { position: fixed; bottom: 20px; right: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 8px; }
.toast { padding: 12px 20px; border-radius: 10px; color: white; cursor: pointer; }
.toast-success { background: #10b981; }
.toast-error { background: #ef4444; }
.loading-state { text-align: center; padding: 40px; }
.spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6a11cb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.toggle-dist { color: #8b5cf6; background: none; border: none; cursor: pointer; }
.dist-detail-cell { background: #f8fafc; padding: 12px; }
.dist-detail h4 { font-size: 14px; margin: 0 0 8px; }
.mini-table { width: 100%; font-size: 12px; border-collapse: collapse; }
.mini-table th { background: #e2e8f0; padding: 4px 8px; text-align: left; }
.mini-table td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
.returned { color: #dc2626; font-size: 11px; }
.unassigned { margin-top: 8px; color: #64748b; font-style: italic; }
.no-dist { color: #94a3b8; font-size: 13px; }
.dist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.view-toggle { display: flex; gap: 4px; }
.toggle-btn { padding: 4px 10px; font-size: 11px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; color: #475569; }
.toggle-btn.active { background: #6a11cb; color: white; border-color: #6a11cb; }
.btn-warning { background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; }
.selected-files { margin-top: 10px; }
.selected-files ul { padding-left: 20px; }
.evidence-warning {
  color: #d97706;
  font-size: 14px;
  margin-right: 4px;
}
.evidence-files {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.evidence-count {
  font-size: 11px;
  color: #6a11cb;
  font-weight: 600;
}
.evidence-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.evidence-link {
  font-size: 11px;
  padding: 2px 8px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 4px;
  text-decoration: none;
  white-space: nowrap;
}
.evidence-link:hover {
  background: #ddd6fe;
  text-decoration: underline;
}
.evidence-container {
  position: relative;
}
.evidence-list {
  position: absolute;
  top: 28px;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 10;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.evidence-item {
  font-size: 12px;
  color: #7c3aed;
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 4px;
}
.evidence-item:hover {
  background: #f1f5f9;
}
.return-btn {
  margin-left: 4px;
  background: #fef3c7;
  border: none;
  color: #b45309;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}
.return-btn:hover {
  background: #fde68a;
}
.reassign-btn {
  margin-left: 4px;
  background: #dcfce7;
  border: none;
  color: #166534;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}
.reassign-btn:hover {
  background: #bbf7d0;
}
.toggle-interval { color: #8b5cf6; }
.interval-detail-cell { background: #fafbfc; padding: 12px; }
.interval-wrapper {
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  background: white;
}
.interval-dists {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 4px solid #6a11cb;
}
.dist-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}
.interval-detail h4 { margin-bottom: 8px; }
.interval-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
.interval-info { flex: 1; font-size: 13px; }
.interval-actions { display: flex; align-items: center; gap: 8px; }
.btn-sm { padding: 4px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; }
.btn-sm.distribute { color: #10b981; border-color: #10b981; }
.btn-sm.evidence { color: #8b5cf6; border-color: #8b5cf6; }
.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}
.status-pending { background: #f1f5f9; color: #475569; }
.status-active { background: #dbeafe; color: #1e40af; }
.status-distributed { background: #dcfce7; color: #166534; }
.btn-icon { background: none; border: none; color: #ef4444; font-size: 18px; cursor: pointer; }

.warning-box {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.warning-box p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #92400e;
}
.active-dist { color: #10b981; font-weight: 600; }

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.history-item {
  font-size: 10px;
  line-height: 1.2;
  position: relative;
}
.tooltip-container:hover .tooltip-content {
  display: block;
}
.tooltip-content {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 200px;
  background: #1e293b;
  color: white;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  margin-bottom: 5px;
  white-space: normal;
}
.tooltip-content::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 10px;
  border-width: 5px;
  border-style: solid;
  border-color: #1e293b transparent transparent transparent;
}
.hist-out { color: #ef4444; }
.hist-in { color: #10b981; }

</style>