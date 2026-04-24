'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('\n🎁 Starting Charity Module database seeding (v2)...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 1. Clear all charity tables (order matters for FK constraints)
      console.log('\n🗑️  Clearing existing charity data...');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_logs" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_approvals" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_deductions" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_distributions" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiary_transfers" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiaries" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiary_groups" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_locations" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_items" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donations" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "campaigns" RESTART IDENTITY CASCADE');
      await queryInterface.sequelize.query('TRUNCATE TABLE "donation_companies" RESTART IDENTITY CASCADE');
      console.log('✅ All charity tables cleared');

      // 2. Fetch existing employee references
      const employees = await queryInterface.sequelize.query(
        `SELECT employee_id, first_name, last_name FROM "employees" WHERE is_active = true LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const defaultEmployeeId = employees[0]?.employee_id || 1;
      console.log(`✅ Using employee ID ${defaultEmployeeId} for references`);

      // 3. Seed donation_companies
      console.log('\n🏢 Seeding donation_companies...');
      await queryInterface.bulkInsert('donation_companies', [
        { name: 'Ethio Telecom', type: 'main', contact_info: JSON.stringify({ email: 'donations@ethiotelecom.et', phone: '+251111234567' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Dashen Bank', type: 'partner', contact_info: JSON.stringify({ email: 'csr@dashenbank.com', phone: '+251115550001' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Ethiopian Airlines', type: 'sister', contact_info: JSON.stringify({ email: 'community@ethiopianairlines.com', phone: '+251116655555' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Awash Bank', type: 'partner', contact_info: JSON.stringify({ email: 'foundation@awashbank.com', phone: '+251115558888' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'MIDROC Ethiopia', type: 'main', contact_info: JSON.stringify({ email: 'csr@midroc-ethiopia.com', phone: '+251116660000' }), is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 5 donation_companies seeded');

      // 4. Seed campaigns (with possible extension/termination fields)
      console.log('\n📢 Seeding campaigns...');
      await queryInterface.bulkInsert('campaigns', [
        { title: 'Ramadan Food Drive 2026', description: 'Food packages for families', category: 'Food Security', start_date: '2026-03-01', end_date: '2026-04-20', target_amount: 500000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Back to School 2026', description: 'School supplies for orphans', category: 'Education', start_date: '2026-07-01', end_date: '2026-09-15', target_amount: 300000.00, status: 'planned', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Winter Warmth 2025', description: 'Blankets for displaced families', category: 'Emergency Relief', start_date: '2025-11-01', end_date: '2025-12-31', target_amount: 200000.00, status: 'completed', actual_end_date: '2025-12-31', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Medical Aid for IDPs', description: 'Essential medicines', category: 'Health', start_date: '2026-01-15', end_date: '2026-06-30', target_amount: 750000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Clean Water Initiative', description: 'Boreholes & water pumps', category: 'Water & Sanitation', start_date: '2026-05-01', end_date: '2026-12-31', target_amount: 1200000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 5 campaigns seeded');

      // 5. Seed locations
      console.log('\n📍 Seeding donation locations...');
      await queryInterface.bulkInsert('donation_locations', [
        { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Bole', description: 'Bole sub-city' },
        { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Kirkos', description: 'Kirkos' },
        { region: 'Oromia', city: 'Adama', woreda: 'Adama 01', description: 'Adama center' },
        { region: 'Amhara', city: 'Bahir Dar', woreda: 'Bahir Dar Zuria', description: 'Rural Bahir Dar' },
        { region: 'Tigray', city: 'Mekelle', woreda: 'Mekelle City', description: 'Urban Mekelle' },
        { region: 'Somali', city: 'Jijiga', woreda: 'Jijiga Town', description: 'IDP camps near Jijiga' }
      ]);
      console.log('✅ 6 locations seeded');

      // 6. Seed beneficiary groups
      console.log('\n👥 Seeding beneficiary groups...');
      await queryInterface.bulkInsert('beneficiary_groups', [
        { name: 'Addis Ababa Urban Poor', description: 'Low-income families', manager_employee_id: 3, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'IDP Camp Residents', description: 'Internally displaced', manager_employee_id: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Orphan Support Group', description: 'Orphans & vulnerable children', manager_employee_id: 5, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Rural Women Association', description: 'Women-led households', manager_employee_id: 3, is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 4 groups seeded');

      const groups = await queryInterface.sequelize.query(
        `SELECT group_id, name FROM "beneficiary_groups"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const groupMap = {};
      groups.forEach(g => { groupMap[g.name] = g.group_id; });

      // 7. Seed beneficiaries (only individual and organization)
      console.log('\n👨‍👩‍👧‍👦 Seeding beneficiaries...');
      await queryInterface.bulkInsert('beneficiaries', [
        { type: 'organization', name: 'Mekedonia Humanitarian Association', contact_info: JSON.stringify({ contact_person: 'Abebech Gobena', phone: '+251911234567' }), location_id: 1, group_id: groupMap['Addis Ababa Urban Poor'], created_at: new Date(), updated_at: new Date() },
        { type: 'individual', name: 'Mohammed Ali', contact_info: JSON.stringify({ phone: '+251922334455' }), location_id: 2, group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() },
        { type: 'organization', name: 'Adama Orphanage Center', contact_info: JSON.stringify({ director: 'Worknesh Kebede', phone: '+251933445566' }), location_id: 3, group_id: groupMap['Orphan Support Group'], created_at: new Date(), updated_at: new Date() },
        { type: 'organization', name: 'Bahir Dar Rural Women Association', contact_info: JSON.stringify({ chairperson: 'Tigist Mulu', phone: '+251944556677' }), location_id: 4, group_id: groupMap['Rural Women Association'], created_at: new Date(), updated_at: new Date() },
        { type: 'organization', name: 'Mekelle Rehabilitation Center', contact_info: JSON.stringify({ manager: 'Gebremedhin Araya', phone: '+251955667788' }), location_id: 5, group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() },
        { type: 'individual', name: 'Fadumo Omar', contact_info: JSON.stringify({ phone: '+251966778899' }), location_id: 6, group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 6 beneficiaries seeded (individuals & organizations)');

      const beneficiaries = await queryInterface.sequelize.query(
        `SELECT beneficiary_id, name FROM "beneficiaries"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const beneficiaryMap = {};
      beneficiaries.forEach(b => { beneficiaryMap[b.name] = b.beneficiary_id; });

      // 8. Seed a beneficiary transfer (example)
      console.log('\n🔄 Seeding beneficiary transfer...');
      const transferBen = beneficiaries.find(b => b.name === 'Mohammed Ali');
      if (transferBen) {
        await queryInterface.bulkInsert('beneficiary_transfers', [{
          beneficiary_id: transferBen.beneficiary_id,
          from_group_id: groupMap['IDP Camp Residents'],
          to_group_id: groupMap['Rural Women Association'],
          reason: 'Relocated to rural area program',
          transferred_by: defaultEmployeeId,
          created_at: new Date()
        }]);
        // Update the beneficiary group
        await queryInterface.sequelize.query(
          `UPDATE "beneficiaries" SET group_id = ? WHERE beneficiary_id = ?`,
          { replacements: [groupMap['Rural Women Association'], transferBen.beneficiary_id] }
        );
        console.log('✅ Transfer seeded');
      }

      // 9. Seed donations (various statuses)
      console.log('\n💰 Seeding donations...');
      const donation_companies = await queryInterface.sequelize.query(
        `SELECT company_id, name FROM "donation_companies"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const companyMap = {};
      donation_companies.forEach(c => { companyMap[c.name] = c.company_id; });

      const campaigns = await queryInterface.sequelize.query(
        `SELECT campaign_id, title FROM "campaigns"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const campaignMap = {};
      campaigns.forEach(c => { campaignMap[c.title] = c.campaign_id; });

      await queryInterface.bulkInsert('donations', [
        { company_id: companyMap['Awash Bank'], campaign_id: campaignMap['Back to School 2026'], donation_date: '2026-08-01', total_value: 0, status: 'draft', notes: 'Pending confirmation', created_at: new Date(), updated_at: new Date() },
        { company_id: companyMap['Ethio Telecom'], campaign_id: campaignMap['Ramadan Food Drive 2026'], donation_date: '2026-03-15', total_value: 150000.00, status: 'pending', notes: 'Food items for Ramadan', created_at: new Date(), updated_at: new Date() },
        { company_id: companyMap['Dashen Bank'], campaign_id: campaignMap['Medical Aid for IDPs'], donation_date: '2026-02-10', total_value: 250000.00, status: 'approved', notes: 'Financial contribution', created_at: new Date(), updated_at: new Date() },
        { company_id: companyMap['Ethiopian Airlines'], campaign_id: campaignMap['Winter Warmth 2025'], donation_date: '2025-11-20', total_value: 80000.00, status: 'distributed', notes: 'Blankets distributed', created_at: new Date(), updated_at: new Date() },
        { company_id: companyMap['MIDROC Ethiopia'], campaign_id: campaignMap['Clean Water Initiative'], donation_date: '2026-05-15', total_value: 0, status: 'cancelled', notes: 'Cancelled due to admin issues', created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 5 donations seeded');

      const donations = await queryInterface.sequelize.query(
        `SELECT donation_id, status FROM "donations" ORDER BY donation_id`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const donationMap = {};
      donations.forEach(d => { if (!donationMap[d.status]) donationMap[d.status] = d.donation_id; });

      // 10. Seed donation items (with payment_method for money items)
      console.log('\n📦 Seeding donation items...');
      const itemsData = [];
      if (donationMap['pending']) {
        itemsData.push(
          { donation_id: donationMap['pending'], type: 'goods', description: 'Flour (50kg bags)', quantity: 100, unit_value: 500.00, total_value: 50000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: donationMap['pending'], type: 'goods', description: 'Cooking Oil (5L)', quantity: 200, unit_value: 300.00, total_value: 60000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: donationMap['pending'], type: 'goods', description: 'Dates (1kg boxes)', quantity: 500, unit_value: 80.00, total_value: 40000.00, created_at: new Date(), updated_at: new Date() }
        );
      }
      if (donationMap['approved']) {
        itemsData.push(
          { donation_id: donationMap['approved'], type: 'money', description: 'Financial contribution', quantity: 1, unit_value: 250000.00, total_value: 250000.00, payment_method: 'bank', unassigned_deduction: 0, created_at: new Date(), updated_at: new Date() }
        );
      }
      if (donationMap['distributed']) {
        itemsData.push(
          { donation_id: donationMap['distributed'], type: 'goods', description: 'Blankets', quantity: 200, unit_value: 250.00, total_value: 50000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: donationMap['distributed'], type: 'goods', description: 'Winter Jackets', quantity: 100, unit_value: 300.00, total_value: 30000.00, created_at: new Date(), updated_at: new Date() }
        );
      }
      await queryInterface.bulkInsert('donation_items', itemsData);
      console.log(`✅ ${itemsData.length} donation items seeded`);

      // Map items for further use
      const items = await queryInterface.sequelize.query(
        `SELECT donation_item_id, donation_id, type, description FROM "donation_items"`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // 11. Seed money deduction (from bank fees)
      console.log('\n💰 Seeding money deduction...');
      const moneyItem = items.find(i => i.type === 'money');
      if (moneyItem) {
        await queryInterface.bulkInsert('donation_deductions', [{
          donation_item_id: moneyItem.donation_item_id,
          amount: 5000.00,
          reason: 'Bank transfer fees',
          reassigned_to_beneficiary_id: null,
          deduction_date: new Date(),
          created_by: defaultEmployeeId,
          created_at: new Date()
        }]);
        // Update unassigned_deduction on item
        await queryInterface.sequelize.query(
          `UPDATE "donation_items" SET unassigned_deduction = 5000.00 WHERE donation_item_id = ?`,
          { replacements: [moneyItem.donation_item_id] }
        );
        console.log('✅ Deduction seeded');
      }

      // 12. Seed distributions
      console.log('\n🚚 Seeding distributions...');
      const blanketItem = items.find(i => i.description === 'Blankets');
      const jacketItem = items.find(i => i.description === 'Winter Jackets');
      const distData = [];
      if (blanketItem) {
        distData.push(
          { donation_item_id: blanketItem.donation_item_id, beneficiary_id: beneficiaryMap['Mekelle Rehabilitation Center'], quantity: 100, value: 100 * 250, created_at: new Date(), updated_at: new Date() },
          { donation_item_id: blanketItem.donation_item_id, beneficiary_id: beneficiaryMap['Fadumo Omar'], quantity: 100, value: 100 * 250, created_at: new Date(), updated_at: new Date() }
        );
      }
      if (jacketItem) {
        distData.push(
          { donation_item_id: jacketItem.donation_item_id, beneficiary_id: beneficiaryMap['Mekelle Rehabilitation Center'], quantity: 50, value: 50 * 300, created_at: new Date(), updated_at: new Date() },
          { donation_item_id: jacketItem.donation_item_id, beneficiary_id: beneficiaryMap['Bahir Dar Rural Women Association'], quantity: 50, value: 50 * 300, created_at: new Date(), updated_at: new Date() }
        );
      }
      if (distData.length > 0) {
        await queryInterface.bulkInsert('donation_distributions', distData);
        console.log(`✅ ${distData.length} distributions seeded`);
      }

      // 13. Return one distribution
      console.log('\n🔄 Seeding distribution return...');
      const firstDist = await queryInterface.sequelize.query(
        `SELECT distribution_id FROM "donation_distributions" ORDER BY distribution_id LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (firstDist.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE "donation_distributions" SET is_returned = true, return_reason = 'Beneficiary not present', returned_at = ? WHERE distribution_id = ?`,
          { replacements: [new Date(), firstDist[0].distribution_id] }
        );
        console.log('✅ Return seeded');
      }

      // 14. Seed approvals
      console.log('\n✔️ Seeding donations approvals...');
      await queryInterface.bulkInsert('donation_approvals', [
        { donation_id: donationMap['pending'], approved_by: null, status: 'pending', created_at: new Date() },
        { donation_id: donationMap['approved'], approved_by: defaultEmployeeId, status: 'approved', comment: 'Verified', created_at: new Date() },
        { donation_id: donationMap['distributed'], approved_by: defaultEmployeeId, status: 'approved', comment: 'Winter relief approved', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      ]);
      console.log('✅ 3 approval records seeded');

      // 15. Seed logs
      console.log('\n📝 Seeding donation logs...');
      const now = new Date();
      const logs = [];
      if (donationMap['pending']) {
        logs.push(
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'CREATE', metadata: '{}', created_at: new Date(now - 5 * 86400000) },
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'ADD_ITEM', metadata: '{"count":3}', created_at: new Date(now - 4 * 86400000) },
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'SUBMIT_FOR_APPROVAL', metadata: '{}', created_at: new Date(now - 3 * 86400000) }
        );
      }
      if (donationMap['approved']) {
        logs.push(
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'CREATE', metadata: '{}', created_at: new Date(now - 20 * 86400000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'ADD_ITEM', metadata: '{"type":"money"}', created_at: new Date(now - 19 * 86400000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'SUBMIT_FOR_APPROVAL', metadata: '{}', created_at: new Date(now - 18 * 86400000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'APPROVE', metadata: '{"comment":"Verified"}', created_at: new Date(now - 17 * 86400000) }
        );
      }
      await queryInterface.bulkInsert('donation_logs', logs);
      console.log(`✅ ${logs.length} log entries seeded`);

      // 16. Display summary
      const summary = await queryInterface.sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM donation_companies) as donation_companies,
          (SELECT COUNT(*) FROM campaigns) as campaigns,
          (SELECT COUNT(*) FROM donations) as donations,
          (SELECT COUNT(*) FROM donation_items) as donation_items,
          (SELECT COUNT(*) FROM donation_locations) as locations,
          (SELECT COUNT(*) FROM beneficiary_groups) as groups,
          (SELECT COUNT(*) FROM beneficiaries) as beneficiaries,
          (SELECT COUNT(*) FROM beneficiary_transfers) as transfers,
          (SELECT COUNT(*) FROM donation_deductions) as deductions,
          (SELECT COUNT(*) FROM donation_distributions) as distributions,
          (SELECT COUNT(*) FROM donation_approvals) as approvals,
          (SELECT COUNT(*) FROM donation_logs) as logs
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log('\n📊 CHARITY MODULE SEED DATA SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ donation_companies: ${summary[0].donation_companies}`);
      console.log(`✅ Campaigns: ${summary[0].campaigns}`);
      console.log(`✅ Donations: ${summary[0].donations}`);
      console.log(`✅ Donation Items: ${summary[0].donation_items}`);
      console.log(`✅ Locations: ${summary[0].locations}`);
      console.log(`✅ Beneficiary Groups: ${summary[0].groups}`);
      console.log(`✅ Beneficiaries: ${summary[0].beneficiaries} (individuals & organizations only)`);
      console.log(`✅ Beneficiary Transfers: ${summary[0].transfers}`);
      console.log(`✅ Money Deductions: ${summary[0].deductions}`);
      console.log(`✅ Distributions: ${summary[0].distributions}`);
      console.log(`✅ Approval Records: ${summary[0].approvals}`);
      console.log(`✅ Audit Logs: ${summary[0].logs}`);
      console.log('\n🎉 Charity Module seed data (v2) ready!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      console.error('❌ Charity module seeding failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('\n🗑️  Removing charity module data...');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_logs" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_approvals" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_deductions" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_distributions" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiary_transfers" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiaries" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "beneficiary_groups" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_locations" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_items" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donations" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "campaigns" RESTART IDENTITY CASCADE');
    await queryInterface.sequelize.query('TRUNCATE TABLE "donation_companies" RESTART IDENTITY CASCADE');
    console.log('✅ Charity module data removed successfully\n');
  }
};