'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('\n🎁 Starting Charity Module database seeding...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // =============================================
      // 1. CLEAR CHARITY TABLES (in correct order)
      // =============================================
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
      
      console.log('✅ Charity tables cleared');

      // =============================================
      // 2. GET EXISTING EMPLOYEE IDs FOR REFERENCES
      // =============================================
      console.log('\n👥 Fetching employee references...');
      
      const employees = await queryInterface.sequelize.query(
        `SELECT employee_id, first_name, last_name FROM "employees" WHERE is_active = true LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      const defaultEmployeeId = employees[0]?.employee_id || 1;
      console.log(`✅ Using employee ID ${defaultEmployeeId} for references`);

      // =============================================
      // 3. SEED donation_companies (Donors)
      // =============================================
      console.log('\n🏢 Seeding donation_companies...');
      
      await queryInterface.bulkInsert('donation_companies', [
        { name: 'Ethio Telecom', type: 'main', contact_info: JSON.stringify({ email: 'donations@ethiotelecom.et', phone: '+251111234567' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Dashen Bank', type: 'partner', contact_info: JSON.stringify({ email: 'csr@dashenbank.com', phone: '+251115550001' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Ethiopian Airlines', type: 'sister', contact_info: JSON.stringify({ email: 'community@ethiopianairlines.com', phone: '+251116655555' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Awash Bank', type: 'partner', contact_info: JSON.stringify({ email: 'foundation@awashbank.com', phone: '+251115558888' }), is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'MIDROC Ethiopia', type: 'main', contact_info: JSON.stringify({ email: 'csr@midroc-ethiopia.com', phone: '+251116660000' }), is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 5 donation_companies seeded');

      // =============================================
      // 4. SEED CAMPAIGNS
      // =============================================
      console.log('\n📢 Seeding campaigns...');
      
      await queryInterface.bulkInsert('campaigns', [
        { title: 'Ramadan Food Drive 2026', description: 'Providing food packages to families in need', category: 'Food Security', start_date: '2026-03-01', end_date: '2026-04-20', target_amount: 500000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Back to School 2026', description: 'School supplies for orphans', category: 'Education', start_date: '2026-07-01', end_date: '2026-09-15', target_amount: 300000.00, status: 'planned', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Winter Warmth 2025', description: 'Blankets for displaced families', category: 'Emergency Relief', start_date: '2025-11-01', end_date: '2025-12-31', target_amount: 200000.00, status: 'completed', actual_end_date: '2025-12-31', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Medical Aid for IDPs', description: 'Essential medicines for IDPs', category: 'Health', start_date: '2026-01-15', end_date: '2026-06-30', target_amount: 750000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() },
        { title: 'Clean Water Initiative', description: 'Boreholes and water pumps', category: 'Water & Sanitation', start_date: '2026-05-01', end_date: '2026-12-31', target_amount: 1200000.00, status: 'active', created_by: defaultEmployeeId, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 5 campaigns seeded');

      // =============================================
      // 5. SEED LOCATIONS
      // =============================================
      console.log('\n📍 Seeding donation locations...');
      
      await queryInterface.bulkInsert('donation_locations', [
        { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Bole', description: 'Bole sub-city' },
        { region: 'Addis Ababa', city: 'Addis Ababa', woreda: 'Kirkos', description: 'Kirkos sub-city' },
        { region: 'Oromia', city: 'Adama', woreda: 'Adama 01', description: 'Adama city center' },
        { region: 'Amhara', city: 'Bahir Dar', woreda: 'Bahir Dar Zuria', description: 'Rural Bahir Dar' },
        { region: 'Tigray', city: 'Mekelle', woreda: 'Mekelle City', description: 'Urban Mekelle' },
        { region: 'Somali', city: 'Jijiga', woreda: 'Jijiga Town', description: 'IDP camps near Jijiga' }
      ]);
      console.log('✅ 6 locations seeded');

      // =============================================
      // 6. SEED BENEFICIARY GROUPS (NEW)
      // =============================================
      console.log('\n👥 Seeding beneficiary groups...');
      
      await queryInterface.bulkInsert('beneficiary_groups', [
        { name: 'Addis Ababa Urban Poor', description: 'Low-income families in Addis', manager_employee_id: defaultEmployeeId, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'IDP Camp Residents', description: 'Internally displaced persons', manager_employee_id: defaultEmployeeId, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Orphan Support Group', description: 'Orphans and vulnerable children', manager_employee_id: defaultEmployeeId, is_active: true, created_at: new Date(), updated_at: new Date() },
        { name: 'Rural Women Association', description: 'Women-led households in rural areas', manager_employee_id: defaultEmployeeId, is_active: true, created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 4 beneficiary groups seeded');

      // Get group IDs for reference
      const groups = await queryInterface.sequelize.query(
        `SELECT group_id, name FROM "beneficiary_groups"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const groupMap = {};
      groups.forEach(g => { groupMap[g.name] = g.group_id; });

      // Get location IDs
      const locations = await queryInterface.sequelize.query(
        `SELECT location_id, region, city FROM "donation_locations"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const locationMap = {};
      locations.forEach(l => { locationMap[`${l.region}-${l.city}`] = l.location_id; });

      // =============================================
      // 7. SEED BENEFICIARIES (with group_id)
      // =============================================
      console.log('\n👨‍👩‍👧‍👦 Seeding beneficiaries...');
      
      await queryInterface.bulkInsert('beneficiaries', [
        { type: 'organization', name: 'Mekedonia Humanitarian Association', contact_info: JSON.stringify({ contact_person: 'Abebech Gobena', phone: '+251911234567' }), location_id: locationMap['Addis Ababa-Addis Ababa'], group_id: groupMap['Addis Ababa Urban Poor'], created_at: new Date(), updated_at: new Date() },
        { type: 'group', name: 'Bole IDP Camp Committee', contact_info: JSON.stringify({ representative: 'Mohammed Ali', phone: '+251922334455' }), location_id: locationMap['Addis Ababa-Addis Ababa'], group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() },
        { type: 'organization', name: 'Adama Orphanage Center', contact_info: JSON.stringify({ director: 'Worknesh Kebede', phone: '+251933445566' }), location_id: locationMap['Oromia-Adama'], group_id: groupMap['Orphan Support Group'], created_at: new Date(), updated_at: new Date() },
        { type: 'group', name: 'Bahir Dar Rural Women Association', contact_info: JSON.stringify({ chairperson: 'Tigist Mulu', phone: '+251944556677' }), location_id: locationMap['Amhara-Bahir Dar'], group_id: groupMap['Rural Women Association'], created_at: new Date(), updated_at: new Date() },
        { type: 'organization', name: 'Mekelle Rehabilitation Center', contact_info: JSON.stringify({ manager: 'Gebremedhin Araya', phone: '+251955667788' }), location_id: locationMap['Tigray-Mekelle'], group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() },
        { type: 'group', name: 'Jijiga IDP Women Group', contact_info: JSON.stringify({ leader: 'Fadumo Omar', phone: '+251966778899' }), location_id: locationMap['Somali-Jijiga'], group_id: groupMap['IDP Camp Residents'], created_at: new Date(), updated_at: new Date() }
      ]);
      console.log('✅ 6 beneficiaries seeded');

      // Get beneficiary IDs
      const beneficiaries = await queryInterface.sequelize.query(
        `SELECT beneficiary_id, name FROM "beneficiaries"`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const beneficiaryMap = {};
      beneficiaries.forEach(b => { beneficiaryMap[b.name] = b.beneficiary_id; });

      // =============================================
      // 8. SEED BENEFICIARY TRANSFERS (example)
      // =============================================
      console.log('\n🔄 Seeding beneficiary transfers...');
      
      // Transfer one beneficiary from IDP Camp Residents to Rural Women Association
      const transferBeneficiary = beneficiaries.find(b => b.name === 'Bole IDP Camp Committee');
      if (transferBeneficiary) {
        await queryInterface.bulkInsert('beneficiary_transfers', [{
          beneficiary_id: transferBeneficiary.beneficiary_id,
          from_group_id: groupMap['IDP Camp Residents'],
          to_group_id: groupMap['Rural Women Association'],
          reason: 'Relocated to rural area program',
          transferred_by: defaultEmployeeId,
          created_at: new Date()
        }]);
        // Update the beneficiary's group_id to match the transfer
        await queryInterface.sequelize.query(
          `UPDATE "beneficiaries" SET group_id = ? WHERE beneficiary_id = ?`,
          { replacements: [groupMap['Rural Women Association'], transferBeneficiary.beneficiary_id] }
        );
      }
      console.log('✅ Transfer record seeded');

      // =============================================
      // 9. SEED DONATIONS (various statuses)
      // =============================================
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

      // Draft donation
      await queryInterface.bulkInsert('donations', [{
        company_id: companyMap['Awash Bank'],
        campaign_id: campaignMap['Back to School 2026'],
        donation_date: '2026-08-01',
        total_value: 0,
        status: 'draft',
        notes: 'Pending confirmation',
        created_at: new Date(),
        updated_at: new Date()
      }]);

      // Pending donation
      await queryInterface.bulkInsert('donations', [{
        company_id: companyMap['Ethio Telecom'],
        campaign_id: campaignMap['Ramadan Food Drive 2026'],
        donation_date: '2026-03-15',
        total_value: 150000.00,
        status: 'pending',
        notes: 'Food items for Ramadan',
        created_at: new Date(),
        updated_at: new Date()
      }]);

      // Approved donation (money)
      await queryInterface.bulkInsert('donations', [{
        company_id: companyMap['Dashen Bank'],
        campaign_id: campaignMap['Medical Aid for IDPs'],
        donation_date: '2026-02-10',
        total_value: 250000.00,
        status: 'approved',
        notes: 'Financial contribution',
        created_at: new Date(),
        updated_at: new Date()
      }]);

      // Distributed donation
      await queryInterface.bulkInsert('donations', [{
        company_id: companyMap['Ethiopian Airlines'],
        campaign_id: campaignMap['Winter Warmth 2025'],
        donation_date: '2025-11-20',
        total_value: 80000.00,
        status: 'distributed',
        notes: 'Blankets distributed',
        created_at: new Date(),
        updated_at: new Date()
      }]);

      // Cancelled donation
      await queryInterface.bulkInsert('donations', [{
        company_id: companyMap['MIDROC Ethiopia'],
        campaign_id: campaignMap['Clean Water Initiative'],
        donation_date: '2026-05-15',
        total_value: 0,
        status: 'cancelled',
        notes: 'Cancelled - admin issues',
        created_at: new Date(),
        updated_at: new Date()
      }]);

      console.log('✅ 5 donations seeded');

      // Get donation IDs
      const donations = await queryInterface.sequelize.query(
        `SELECT donation_id, status, company_id FROM "donations" ORDER BY donation_id`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      const donationMap = {};
      donations.forEach(d => {
        if (!donationMap[d.status]) donationMap[d.status] = d.donation_id;
      });

      // =============================================
      // 10. SEED DONATION ITEMS
      // =============================================
      console.log('\n📦 Seeding donation items...');
      
      const donationItemsData = [];
      
      // Items for Pending donation (goods)
      const pendingId = donationMap['pending'];
      if (pendingId) {
        donationItemsData.push(
          { donation_id: pendingId, type: 'goods', description: 'Flour (50kg bags)', quantity: 100, unit_value: 500.00, total_value: 50000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: pendingId, type: 'goods', description: 'Cooking Oil (5L)', quantity: 200, unit_value: 300.00, total_value: 60000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: pendingId, type: 'goods', description: 'Dates (1kg boxes)', quantity: 500, unit_value: 80.00, total_value: 40000.00, created_at: new Date(), updated_at: new Date() }
        );
      }
      
      // Items for Approved donation (money)
      const approvedId = donationMap['approved'];
      if (approvedId) {
        donationItemsData.push(
          { donation_id: approvedId, type: 'money', description: 'Financial contribution', quantity: 1, unit_value: 250000.00, total_value: 250000.00, payment_method: 'bank', unassigned_deduction: 0, created_at: new Date(), updated_at: new Date() }
        );
      }
      
      // Items for Distributed donation (goods)
      const distributedId = donationMap['distributed'];
      if (distributedId) {
        donationItemsData.push(
          { donation_id: distributedId, type: 'goods', description: 'Blankets', quantity: 200, unit_value: 250.00, total_value: 50000.00, created_at: new Date(), updated_at: new Date() },
          { donation_id: distributedId, type: 'goods', description: 'Winter Jackets', quantity: 100, unit_value: 300.00, total_value: 30000.00, created_at: new Date(), updated_at: new Date() }
        );
      }
      
      await queryInterface.bulkInsert('donation_items', donationItemsData);
      console.log(`✅ ${donationItemsData.length} donation items seeded`);

      // Get all donation items for later use
      const items = await queryInterface.sequelize.query(
        `SELECT donation_item_id, donation_id, type, description, total_value FROM "donation_items"`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // =============================================
      // 11. SEED MONEY DEDUCTIONS (NEW)
      // =============================================
      console.log('\n💰 Seeding money deductions...');
      
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
        // Update unassigned_deduction on the item
        await queryInterface.sequelize.query(
          `UPDATE "donation_items" SET unassigned_deduction = 5000.00 WHERE donation_item_id = ?`,
          { replacements: [moneyItem.donation_item_id] }
        );
        console.log('✅ Money deduction seeded');
      } else {
        console.log('ℹ️ No money item found for deduction');
      }

      // =============================================
      // 12. SEED DONATION DISTRIBUTIONS
      // =============================================
      console.log('\n🚚 Seeding donation distributions...');
      
      const distributions = [];
      
      // Distribute items from distributed donation
      const blanketItem = items.find(i => i.description === 'Blankets');
      const jacketItem = items.find(i => i.description === 'Winter Jackets');
      
      if (blanketItem) {
        distributions.push(
          { donation_item_id: blanketItem.donation_item_id, beneficiary_id: beneficiaryMap['Mekelle Rehabilitation Center'], quantity: 100, value: 100 * 250, created_at: new Date(), updated_at: new Date() },
          { donation_item_id: blanketItem.donation_item_id, beneficiary_id: beneficiaryMap['Jijiga IDP Women Group'], quantity: 100, value: 100 * 250, created_at: new Date(), updated_at: new Date() }
        );
      }
      if (jacketItem) {
        distributions.push(
          { donation_item_id: jacketItem.donation_item_id, beneficiary_id: beneficiaryMap['Mekelle Rehabilitation Center'], quantity: 50, value: 50 * 300, created_at: new Date(), updated_at: new Date() },
          { donation_item_id: jacketItem.donation_item_id, beneficiary_id: beneficiaryMap['Bahir Dar Rural Women Association'], quantity: 50, value: 50 * 300, created_at: new Date(), updated_at: new Date() }
        );
      }
      
      if (distributions.length > 0) {
        await queryInterface.bulkInsert('donation_distributions', distributions);
        console.log(`✅ ${distributions.length} distributions seeded`);
      } else {
        console.log('ℹ️ No distributions seeded');
      }

      // =============================================
      // 13. SEED DISTRIBUTION RETURN (NEW)
      // =============================================
      console.log('\n🔄 Seeding distribution return...');
      
      // Get the first distribution we just created
      const createdDistributions = await queryInterface.sequelize.query(
        `SELECT distribution_id FROM "donation_distributions" LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (createdDistributions.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE "donation_distributions" SET is_returned = true, return_reason = 'Beneficiary not present', returned_at = ? WHERE distribution_id = ?`,
          { replacements: [new Date(), createdDistributions[0].distribution_id] }
        );
        console.log('✅ Distribution return seeded');
      } else {
        console.log('ℹ️ No distribution to return');
      }

      // =============================================
      // 14. SEED DONATION APPROVALS
      // =============================================
      console.log('\n✔️ Seeding donation approvals...');
      
      const approvals = [];
      if (donationMap['pending']) {
        approvals.push({ donation_id: donationMap['pending'], approved_by: null, status: 'pending', comment: null, created_at: new Date() });
      }
      if (donationMap['approved']) {
        approvals.push({ donation_id: donationMap['approved'], approved_by: defaultEmployeeId, status: 'approved', comment: 'Verified', created_at: new Date() });
      }
      if (donationMap['distributed']) {
        approvals.push({ donation_id: donationMap['distributed'], approved_by: defaultEmployeeId, status: 'approved', comment: 'Winter relief approved', created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) });
      }
      await queryInterface.bulkInsert('donation_approvals', approvals);
      console.log(`✅ ${approvals.length} approval records seeded`);

      // =============================================
      // 15. SEED DONATION LOGS
      // =============================================
      console.log('\n📝 Seeding donation logs...');
      
      const logs = [];
      const now = new Date();
      
      if (donationMap['pending']) {
        logs.push(
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'CREATE', metadata: '{}', created_at: new Date(now - 5 * 24 * 60 * 60 * 1000) },
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'ADD_ITEM', metadata: '{"count":3}', created_at: new Date(now - 4 * 24 * 60 * 60 * 1000) },
          { donation_id: donationMap['pending'], user_id: defaultEmployeeId, action: 'SUBMIT_FOR_APPROVAL', metadata: '{}', created_at: new Date(now - 3 * 24 * 60 * 60 * 1000) }
        );
      }
      if (donationMap['approved']) {
        logs.push(
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'CREATE', metadata: '{}', created_at: new Date(now - 20 * 24 * 60 * 60 * 1000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'ADD_ITEM', metadata: '{"type":"money"}', created_at: new Date(now - 19 * 24 * 60 * 60 * 1000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'SUBMIT_FOR_APPROVAL', metadata: '{}', created_at: new Date(now - 18 * 24 * 60 * 60 * 1000) },
          { donation_id: donationMap['approved'], user_id: defaultEmployeeId, action: 'APPROVE', metadata: '{"comment":"Verified"}', created_at: new Date(now - 17 * 24 * 60 * 60 * 1000) }
        );
      }
      await queryInterface.bulkInsert('donation_logs', logs);
      console.log(`✅ ${logs.length} log entries seeded`);

      // =============================================
      // 16. DISPLAY SUMMARY
      // =============================================
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
      console.log(`✅ Beneficiaries: ${summary[0].beneficiaries}`);
      console.log(`✅ Beneficiary Transfers: ${summary[0].transfers}`);
      console.log(`✅ Money Deductions: ${summary[0].deductions}`);
      console.log(`✅ Distributions: ${summary[0].distributions}`);
      console.log(`✅ Approval Records: ${summary[0].approvals}`);
      console.log(`✅ Audit Logs: ${summary[0].logs}`);
      
      console.log('\n🎉 Charity Module seed data ready (v2 features included)!');
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