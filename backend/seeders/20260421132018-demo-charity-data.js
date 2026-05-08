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

    // 2. Fetch employee references
    const employees = await queryInterface.sequelize.query(
      `SELECT employee_id FROM "employees" WHERE is_active = true LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const empId = employees[0]?.employee_id || 1;
    const managerId = employees[1]?.employee_id || empId;

    // 3. Donation Companies
    console.log('🏢 Seeding Companies...');
    await queryInterface.bulkInsert('donation_companies', [
      { name: 'Global Tech Solutions', type: 'main', contact_info: JSON.stringify({ email: 'info@globaltech.com', phone: '+251911223344' }), is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Unity Bank SC', type: 'partner', contact_info: JSON.stringify({ email: 'charity@unitybank.com' }), is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Sunshine Foundation', type: 'sister', is_active: true, created_at: new Date(), updated_at: new Date() },
      { name: 'Red Cross Ethiopia', type: 'partner', is_active: true, created_at: new Date(), updated_at: new Date() }
    ]);

    // 4. Campaigns
    console.log('📢 Seeding Campaigns...');
    await queryInterface.bulkInsert('campaigns', [
      { 
        title: 'Winter Warmth 2026', 
        description: 'Providing blankets and clothing for displaced families.', 
        category: 'Disaster Relief',
        status: 'active', 
        start_date: '2026-01-01', 
        target_amount: 1500000, 
        created_by: empId, 
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        title: 'Tech for Students', 
        description: 'Monthly internet and device support for low-income university students.', 
        category: 'Education',
        status: 'active', 
        start_date: '2026-03-01', 
        target_amount: 800000, 
        created_by: empId, 
        created_at: new Date(), 
        updated_at: new Date() 
      },
      { 
        title: 'Legacy Healthcare Project', 
        description: 'Building a local clinic in Oromia region.', 
        category: 'Healthcare',
        status: 'planned', 
        target_amount: 5000000, 
        created_by: managerId, 
        created_at: new Date(), 
        updated_at: new Date() 
      }
    ]);

    // 5. Locations & Groups
    console.log('📍 Seeding Locations & Groups...');
    await queryInterface.bulkInsert('beneficiary_locations', [
      { region: 'Addis Ababa', city: 'Addis', woreda: 'Bole', description: 'Central District' },
      { region: 'Oromia', city: 'Adama', woreda: 'Woreda 03', description: 'Rural Outreach' },
      { region: 'Amhara', city: 'Bahir Dar', woreda: 'Woreda 01', description: 'Lakeside Communities' }
    ]);

    await queryInterface.bulkInsert('beneficiary_groups', [
      { name: 'Bole Orphan Support', manager_employee_id: managerId, description: 'Support for orphans in Bole area', created_at: new Date(), updated_at: new Date() },
      { name: 'Adama Displaced Families', manager_employee_id: empId, description: 'IDPs currently in Adama camps', created_at: new Date(), updated_at: new Date() },
      { name: 'STEM Students Pool', manager_employee_id: managerId, description: 'University students in STEM fields', created_at: new Date(), updated_at: new Date() }
    ]);
    
    // 6. Beneficiaries
    console.log('👥 Seeding Beneficiaries...');
    await queryInterface.bulkInsert('beneficiaries', [
      { type: 'individual', name: 'Selamawit Tadesse', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() },
      { type: 'individual', name: 'Dawit Mekonnen', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() },
      { type: 'organization', name: 'Emmanuel Childrens Home', location_id: 1, group_id: 1, created_at: new Date(), updated_at: new Date() },
      { type: 'individual', name: 'Fatuma Ahmed', location_id: 2, group_id: 2, created_at: new Date(), updated_at: new Date() },
      { type: 'individual', name: 'Yonas Berhane', location_id: 3, group_id: 3, created_at: new Date(), updated_at: new Date() }
    ]);

    // 7. Donations
    console.log('💰 Seeding Donations...');
    await queryInterface.bulkInsert('donations', [
      // Case 1: Fully approved and partially distributed (Winter Campaign)
      { company_id: 1, campaign_id: 1, status: 'approved', total_value: 1200000, notes: 'Direct corporate social responsibility fund.', created_at: new Date(), updated_at: new Date() },
      // Case 2: In-progress recurring donation (Tech for Students)
      { company_id: 2, campaign_id: 2, status: 'approved', total_value: 600000, notes: 'Partnership for digital inclusion.', created_at: new Date(), updated_at: new Date() },
      // Case 3: Draft donation (Healthcare)
      { company_id: 3, campaign_id: 3, status: 'draft', total_value: 500000, created_at: new Date(), updated_at: new Date() },
      // Case 4: Distributed donation
      { company_id: 4, campaign_id: 1, status: 'distributed', total_value: 200000, created_at: new Date(), updated_at: new Date() }
    ]);

    // 8. Donation Items
    console.log('📦 Seeding Donation Items...');
    await queryInterface.bulkInsert('donation_items', [
      // Donation 1 (Winter)
      { donation_id: 1, type: 'goods', description: 'Heavy Blankets', quantity: 500, unit_value: 1500, total_value: 750000, is_recurring: false, status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_id: 1, type: 'money', description: 'Logistics Fund', total_value: 450000, is_recurring: false, status: 'pending', created_at: new Date(), updated_at: new Date() },
      
      // Donation 2 (Tech - Recurring)
      { donation_id: 2, type: 'money', description: 'Internet Stipend', total_value: 300000, is_recurring: true, status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_id: 2, type: 'goods', description: 'Tablets', quantity: 20, unit_value: 15000, total_value: 300000, is_recurring: false, status: 'pending', created_at: new Date(), updated_at: new Date() },

      // Donation 4 (Distributed)
      { donation_id: 4, type: 'goods', description: 'Winter Jackets', quantity: 200, unit_value: 1000, total_value: 200000, is_recurring: false, status: 'distributed', created_at: new Date(), updated_at: new Date() }
    ]);

    // 9. Recurring Intervals (for Item 3: Internet Stipend)
    console.log('⏳ Seeding Recurring Intervals...');
    await queryInterface.bulkInsert('donation_item_intervals', [
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 1, start_date: '2026-05-01', end_date: '2026-05-31', status: 'distributed', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 2, start_date: '2026-06-01', end_date: '2026-06-30', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 3, start_date: '2026-07-01', end_date: '2026-07-31', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 4, start_date: '2026-08-01', end_date: '2026-08-31', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 5, start_date: '2026-09-01', end_date: '2026-09-30', status: 'pending', created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 3, interval_type: 'monthly', interval_count: 6, start_date: '2026-10-01', end_date: '2026-10-31', status: 'pending', created_at: new Date(), updated_at: new Date() }
    ]);

    // 10. Distributions
    console.log('🚚 Seeding Distributions...');
    await queryInterface.bulkInsert('donation_distributions', [
      // Item 1: Blankets (One-time)
      { donation_item_id: 1, beneficiary_id: 1, quantity: 100, value: 150000, created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 1, beneficiary_id: 2, quantity: 100, value: 150000, created_at: new Date(), updated_at: new Date() },
      { donation_item_id: 1, beneficiary_id: 3, quantity: 300, value: 450000, created_at: new Date(), updated_at: new Date() },
      
      // Item 3: Internet Stipend (Interval 1 - Distributed)
      { donation_item_id: 3, beneficiary_id: 5, interval_id: 1, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      
      // Item 3: Internet Stipend (Interval 2 - Pending)
      { donation_item_id: 3, beneficiary_id: 5, interval_id: 2, quantity: 1, value: 50000, created_at: new Date(), updated_at: new Date() },
      
      // Item 4: Tablets (One-time)
      { donation_item_id: 4, beneficiary_id: 5, quantity: 20, value: 300000, created_at: new Date(), updated_at: new Date() },

      // Item 5: Jackets (Finalized)
      { donation_item_id: 5, beneficiary_id: 4, quantity: 200, value: 200000, created_at: new Date(), updated_at: new Date() }
    ]);

    // 11. Evidences
    console.log('📸 Seeding Evidence...');
    await queryInterface.bulkInsert('donation_distribution_evidences', [
      { donation_item_id: 3, interval_id: 1, file_url: '/uploads/documents/charityEvidences/demo-stipend.pdf', file_name: 'May_Stipend_Receipts.pdf', file_type: 'application/pdf', uploaded_by: empId, created_at: new Date() },
      { donation_item_id: 5, file_url: '/uploads/documents/charityEvidences/demo-jackets.jpg', file_name: 'Distribution_Photo.jpg', file_type: 'image/jpeg', uploaded_by: managerId, created_at: new Date() }
    ]);

    // 12. Complex Scenarios: Reassignments and Returns
    console.log('🔄 Seeding Reassignments and Returns...');
    
    // Scenario A: Full Return (Selamawit returned blankets)
    // distribution_id 1 is Selamawit's blankets
    await queryInterface.sequelize.query(
      `UPDATE donation_distributions SET is_returned = true, return_reason = 'Family moved to a government shelter with provided bedding.', returned_at = NOW() WHERE distribution_id = 1`
    );

    // Scenario B: Partial Reassignment (Dawit's blankets reassigned)
    // distribution_id 2 is Dawit's blankets (originally 100 blankets, 150,000 ETB)
    // Move 30 blankets (45,000 ETB) from Dawit (ID 2) to Fatuma (ID 4)
    await queryInterface.sequelize.query(
      `UPDATE donation_distributions SET quantity = 70, value = 105000 WHERE distribution_id = 2`
    );
    
    // Create new distribution for Fatuma
    await queryInterface.bulkInsert('donation_distributions', [
      { donation_item_id: 1, beneficiary_id: 4, quantity: 30, value: 45000, created_at: new Date(), updated_at: new Date() }
    ]);

    // Record the deduction/reassignment
    await queryInterface.bulkInsert('donation_deductions', [
      { 
        donation_item_id: 1, 
        distribution_id: 2, 
        from_beneficiary_id: 2, 
        reassigned_to_beneficiary_id: 4, 
        amount: 45000, 
        reason: 'Surplus blankets identified at Dawit\'s household; redirected to Fatuma in Adama.', 
        created_by: empId, 
        created_at: new Date() 
      }
    ]);

    // Scenario C: Pure Deduction to Pool (Orphanage item 1)
    // distribution_id 3 is Orphanage (originally 300, 450,000 ETB)
    // Deduct 50 blankets (75,000 ETB) to pool
    await queryInterface.sequelize.query(
      `UPDATE donation_distributions SET quantity = 250, value = 375000 WHERE distribution_id = 3`
    );
    await queryInterface.sequelize.query(
      `UPDATE donation_items SET unassigned_deduction = 75000 WHERE donation_item_id = 1`
    );
    await queryInterface.bulkInsert('donation_deductions', [
      { 
        donation_item_id: 1, 
        distribution_id: 3, 
        from_beneficiary_id: 3, 
        reassigned_to_beneficiary_id: null, 
        amount: 75000, 
        reason: 'Quality check failed for 50 units; returned to central pool for replacement.', 
        created_by: managerId, 
        created_at: new Date() 
      }
    ]);

    // 13. Approvals
    console.log('✅ Seeding Approvals...');
    await queryInterface.bulkInsert('donation_approvals', [
      { donation_id: 1, approved_by: empId, status: 'approved', comment: 'Winter relief priority 1. All documents verified.', created_at: new Date() },
      { donation_id: 2, approved_by: managerId, status: 'approved', comment: 'Recurring budget allocated for 6 months.', created_at: new Date() }
    ]);

    // 14. Logs
    console.log('📝 Seeding Logs...');
    await queryInterface.bulkInsert('donation_logs', [
      { donation_id: 1, user_id: empId, action: 'SUBMIT_FOR_APPROVAL', metadata: JSON.stringify({ note: 'Initial submission' }), created_at: new Date() },
      { donation_id: 1, user_id: empId, action: 'APPROVE', metadata: JSON.stringify({ comment: 'Verified' }), created_at: new Date() },
      { donation_id: 1, user_id: empId, action: 'REASSIGN_DISTRIBUTION', metadata: JSON.stringify({ from: 2, to: 4, amount: 45000 }), created_at: new Date() },
      { donation_id: 1, user_id: managerId, action: 'RETURN_DISTRIBUTION', metadata: JSON.stringify({ distId: 1, reason: 'Family moved' }), created_at: new Date() }
    ]);

    console.log('🎉 Charity module demo data seeded successfully!');
  },

  down: async (queryInterface, Sequelize) => {
    // Handled by TRUNCATE in UP
  }
};
