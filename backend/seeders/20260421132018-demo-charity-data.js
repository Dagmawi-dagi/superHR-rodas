'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🎁 Seeding Charity Module (Full Lifecycle)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Clear all charity tables
    console.log('\n🗑️  Clearing existing charity data...');
    const tables = [
      'donation_deductions', 'donation_logs', 'donation_approvals',
      'donation_distribution_evidences', 'donation_distributions',
      'donation_item_intervals', 'beneficiary_transfers', 'beneficiaries',
      'beneficiary_groups', 'beneficiary_locations', 'donation_items',
      'donations', 'campaigns', 'donation_companies'
    ];
    for (const table of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    console.log('✅ All charity tables cleared');

    // 2. Fetch employee reference
    const employees = await queryInterface.sequelize.query(
      `SELECT employee_id FROM "employees" WHERE is_active = true LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const empId = employees[0]?.employee_id || 1;

    // 3. Companies
    await queryInterface.bulkInsert('donation_companies', [
      { name: 'Ethio Telecom', type: 'main', is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Dashen Bank', type: 'partner', is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Ethiopian Airlines', type: 'sister', is_active: true, created_at: new Date(), updated_at: new Date() }
    ]);

    // 4. Campaigns
    await queryInterface.bulkInsert('campaigns', [
      { title: 'Emergency Food Relief', status: 'active', start_date: '2026-01-01', target_amount: 1000000, created_by: empId, created_at: new Date(), updated_at: new Date() },
      { title: 'Education for All', status: 'active', start_date: '2026-01-01', target_amount: 500000, created_by: empId, created_at: new Date(), updated_at: new Date() }
    ]);

    // 5. Locations & Groups
    await queryInterface.bulkInsert('beneficiary_locations', [{ region: 'Addis Ababa', city: 'Addis', woreda: 'Bole' }]);
    await queryInterface.bulkInsert('beneficiary_groups', [{ name: 'Urban Poor', manager_employee_id: empId, created_at: new Date(), updated_at: new Date() }]);
    
    // 6. Beneficiaries
    await queryInterface.bulkInsert('beneficiaries', [
      { type: 'individual', name: 'Mohammed Ali', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() },
      { type: 'individual', name: 'Abebe Kebede', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() },
      { type: 'organization', name: 'Hope Orphanage', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() }
    ]);

    // 7. Donations (Approved, Distributed, etc.)
    await queryInterface.bulkInsert('donations', [
      { company_id: 1, campaign_id: 1, status: 'approved', total_value: 500000, created_at: new Date(), updated_at: new Date() },
      { company_id: 2, campaign_id: 2, status: 'distributed', total_value: 100000, created_at: new Date(), updated_at: new Date() }
    ]);

    // 8. Donation Items
    await queryInterface.bulkInsert('donation_items', [
      // Approved item - One time (Goods)
      { donation_id: 1, type: 'goods', description: 'Rice Bags', quantity: 100, unit_value: 1000, total_value: 100000, is_recurring: false, status: 'pending', created_at: new Date(), updated_at: new Date() },
      // Approved item - Recurring (Money)
      { donation_id: 1, type: 'money', description: 'Monthly Support', quantity: 1, unit_value: 100000, total_value: 400000, is_recurring: true, status: 'pending', created_at: new Date(), updated_at: new Date() },
      // Distributed item
      { donation_id: 2, type: 'goods', description: 'Notebooks', quantity: 500, unit_value: 200, total_value: 100000, is_recurring: false, status: 'distributed', created_at: new Date(), updated_at: new Date() }
    ]);

    // 9. Recurring Intervals
    await queryInterface.bulkInsert('donation_item_intervals', [
      { donation_item_id: 2, interval_type: 'monthly', interval_count: 1, start_date: '2026-05-01', end_date: '2026-05-31', status: 'distributed', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 2, interval_type: 'monthly', interval_count: 2, start_date: '2026-06-01', end_date: '2026-06-30', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 2, interval_type: 'monthly', interval_count: 3, start_date: '2026-07-01', end_date: '2026-07-31', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 2, interval_type: 'monthly', interval_count: 4, start_date: '2026-08-01', end_date: '2026-08-31', status: 'pending', created_at: new Date(), updated_at: new Date() }
    ]);

    // 10. Distributions
    await queryInterface.bulkInsert('donation_distributions', [
      // One-time distributions
      { donation_item_id: 1, beneficiary_id: 1, quantity: 50, value: 50000, created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 1, beneficiary_id: 2, quantity: 50, value: 50000, created_at: new Date(), updated_at: new Date() },
      // Recurring distributions (Interval 1 - Distributed)
      { donation_item_id: 2, beneficiary_id: 1, interval_id: 1, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 2, beneficiary_id: 2, interval_id: 1, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      // Recurring distributions (Interval 2 - Pending)
      { donation_item_id: 2, beneficiary_id: 1, interval_id: 2, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 2, beneficiary_id: 3, interval_id: 2, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      // Finalized distributions
      { donation_item_id: 3, beneficiary_id: 3, quantity: 500, value: 100000, created_at: new Date(), updated_at: new Date() }
    ]);

    // 11. Evidences
    await queryInterface.bulkInsert('donation_distribution_evidences', [
      { donation_item_id: 2, interval_id: 1, file_url: '/uploads/ev1.jpg', uploaded_by: empId, created_at: new Date() },
      { donation_item_id: 3, file_url: '/uploads/ev2.jpg', uploaded_by: empId, created_at: new Date() }
    ]);

    // 12. Reassignment (Deduction record)
    // Scenario: Reassign 10 bags from Mohammed Ali (ID 1) to Abebe Kebede (ID 2) for item 1
    // First, simulated update: Mohammed now has 40, Abebe now has 60.
    await queryInterface.sequelize.query(`UPDATE donation_distributions SET quantity = 40, value = 40000 WHERE distribution_id = 1`);
    await queryInterface.sequelize.query(`UPDATE donation_distributions SET quantity = 60, value = 60000 WHERE distribution_id = 2`);
    
    await queryInterface.bulkInsert('donation_deductions', [
      { 
        donation_item_id: 1, 
        distribution_id: 1, 
        from_beneficiary_id: 1, 
        reassigned_to_beneficiary_id: 2, 
        amount: 10000, 
        reason: 'Mohammed moved to another location', 
        created_by: empId, 
        created_at: new Date() 
      }
    ]);

    // 13. Returns
    // Scenario: Abebe returns 5 notebooks from item 3 (not actually possible if distributed, but for demo data)
    // Actually, let's return a pending distribution.
    // Mohammed returns his Rice Bags (Interval-less)
    await queryInterface.sequelize.query(`UPDATE donation_distributions SET is_returned = true, return_reason = 'Not needed', returned_at = NOW() WHERE distribution_id = 1`);

    // 14. Logs
    await queryInterface.bulkInsert('donation_logs', [
      { donation_id: 1, user_id: empId, action: 'APPROVE', metadata: JSON.stringify({ note: 'Verified by finance' }), created_at: new Date() },
      { donation_id: 1, user_id: empId, action: 'REASSIGN_DISTRIBUTION', metadata: JSON.stringify({ from: 1, to: 2, qty: 10 }), created_at: new Date() }
    ]);

    console.log('🎉 Charity module demo data seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Handled by TRUNCATE in UP
  }
};
