'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('\n🎁 Seeding Charity Module (v4 simplified) with users/roles...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── 0. CLEAR existing charity data ─────────────────────────────────
    const tables = [
      'donation_logs',
      'donation_item_adjustment_requests',
      'donation_distribution_evidences',
      'donation_distributions',
      'donation_item_intervals',
      'donation_items',
      'donations',
      'beneficiary_transfers',
      'beneficiaries',
      'beneficiary_groups',
      'beneficiary_locations',
      'campaigns',
      'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
    }
    console.log('✅ Charity tables cleared');

    // ── 1. Ensure charity roles exist ──────────────────────────────────
    await queryInterface.sequelize.query(`
      INSERT INTO roles (name, description, is_active, created_at, updated_at)
      VALUES 
        ('charity_admin',      'Charity Administrator – full charity access', true, NOW(), NOW()),
        ('charity_teamleader',  'Charity Team Leader – creates donations for their group', true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);

    const [charityAdminRole] = await queryInterface.sequelize.query(`SELECT role_id FROM roles WHERE name = 'charity_admin'`);
    const [charityTLRole]   = await queryInterface.sequelize.query(`SELECT role_id FROM roles WHERE name = 'charity_teamleader'`);
    const adminRoleId = charityAdminRole[0]?.role_id;
    const tlRoleId    = charityTLRole[0]?.role_id;
    if (!adminRoleId || !tlRoleId) throw new Error('Required roles not found after insert');

    // Get a department for the users (e.g. Human Resources)
    const [hrDept] = await queryInterface.sequelize.query(`SELECT department_id FROM departments WHERE name = 'Human Resources'`);
    const hrDeptId = hrDept[0]?.department_id;
    if (!hrDeptId) throw new Error('Human Resources department not found – run the HR seeder first');

    // ── 2. Create charity users if they don't exist ─────────────────────
    const existingUser = await queryInterface.sequelize.query(
      `SELECT user_id FROM users WHERE username IN ('charity_admin','team_lead_group1','team_lead_group2')`
    );
    if (existingUser[0].length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await queryInterface.bulkInsert('users', [
        { username:'charity_admin',   email:'charity.admin@hrsystem.com',   password_hash:hashedPassword, full_name:'Dagmawi Hadgu',   role_id:adminRoleId, department_id:hrDeptId, is_active:true, created_at:new Date(), updated_at:new Date() },
        { username:'team_lead_group1',email:'teamlead1@hrsystem.com',       password_hash:hashedPassword, full_name:'Birtukan Alemu', role_id:tlRoleId,    department_id:hrDeptId, is_active:true, created_at:new Date(), updated_at:new Date() },
        { username:'team_lead_group2',email:'teamlead2@hrsystem.com',       password_hash:hashedPassword, full_name:'Yohannes Tesfaye',role_id:tlRoleId,    department_id:hrDeptId, is_active:true, created_at:new Date(), updated_at:new Date() },
      ]);
    }

    const users = await queryInterface.sequelize.query(`SELECT user_id, username FROM users WHERE username IN ('charity_admin','team_lead_group1','team_lead_group2')`);
    const userMap = {};
    users[0].forEach(u => { userMap[u.username] = u.user_id; });

    // ── 3. Create employees for those users if they don't exist ────────
    const existingEmps = await queryInterface.sequelize.query(`SELECT employee_id FROM employees WHERE employee_code IN ('EMP012','EMP013','EMP014')`);
    if (existingEmps[0].length === 0) {
      const [position] = await queryInterface.sequelize.query(`SELECT position_id FROM positions WHERE title IN ('HR Manager','HR Generalist') LIMIT 1`);
      const posId = position[0]?.position_id;
      if (!posId) throw new Error('Need a position (HR Manager/HR Generalist)');

      await queryInterface.bulkInsert('employees', [
        { employee_code:'EMP012', user_id:userMap['charity_admin'],   first_name:'Dagmawi', last_name:'Hadgu', middle_name:'Tesfaye', date_of_birth:'1988-04-12', gender:'male', work_email:'dagmawi.hadgu@hrsystem.com', phone_number:'+251912000012', hire_date:'2022-01-10', employment_type:'full-time', employment_status:'active', department_id:hrDeptId, position_id:posId, created_at:new Date(), updated_at:new Date() },
        { employee_code:'EMP013', user_id:userMap['team_lead_group1'],first_name:'Birtukan', last_name:'Alemu', date_of_birth:'1992-07-23', gender:'female', work_email:'birtukan.alemu@hrsystem.com', phone_number:'+251913000013', hire_date:'2023-03-01', employment_type:'full-time', employment_status:'active', department_id:hrDeptId, position_id:posId, created_at:new Date(), updated_at:new Date() },
        { employee_code:'EMP014', user_id:userMap['team_lead_group2'],first_name:'Yohannes', last_name:'Tesfaye', date_of_birth:'1990-11-05', gender:'male', work_email:'yohannes.tesfaye@hrsystem.com', phone_number:'+251914000014', hire_date:'2023-03-01', employment_type:'full-time', employment_status:'active', department_id:hrDeptId, position_id:posId, created_at:new Date(), updated_at:new Date() },
      ]);
    }

    const empRecords = await queryInterface.sequelize.query(
      `SELECT employee_id, employee_code FROM employees WHERE employee_code IN ('EMP012','EMP013','EMP014')`
    );
    const empCodeMap = {};
    empRecords[0].forEach(e => { empCodeMap[e.employee_code] = e.employee_id; });

    const cAdmin   = empCodeMap['EMP012'];
    const tLead1   = empCodeMap['EMP013'];
    const tLead2   = empCodeMap['EMP014'];

    // ── 4. DONATION COMPANIES ──────────────────────────────────────────
    console.log('🏢 Seeding donation companies...');
    await queryInterface.bulkInsert('donation_companies', [
      { name: 'Ethio Telecom', type: 'main', contact_info: JSON.stringify({ email:'csr@ethiotelecom.et', phone:'+251115517777' }), is_active:true, created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
      { name: 'Commercial Bank of Ethiopia', type:'partner', contact_info: JSON.stringify({ email:'csr@combanketh.et', phone:'+251115511271' }), is_active:true, created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
    ]);
    const companies = await queryInterface.sequelize.query(`SELECT company_id, name FROM donation_companies`, { type: Sequelize.QueryTypes.SELECT });
    const co = {};
    companies.forEach(c => { co[c.name] = c.company_id; });

    // ── 5. CAMPAIGNS (no target_amount) ─────────────────────────────────
    console.log('📢 Seeding campaigns...');
    await queryInterface.bulkInsert('campaigns', [
      { title:'Ramadan Food Drive 2026', description:'Food packages for families', category:'Food Security', start_date:'2026-03-01', end_date:'2026-04-20', status:'active', created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
      { title:'Medical Aid for IDPs', description:'Essential medicines', category:'Health', start_date:'2026-01-15', end_date:'2026-06-30', status:'active', created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
    ]);
    const campaigns = await queryInterface.sequelize.query(`SELECT campaign_id, title FROM campaigns`, { type: Sequelize.QueryTypes.SELECT });
    const ca = {};
    campaigns.forEach(c => { ca[c.title] = c.campaign_id; });

    // ── 6. BENEFICIARY LOCATIONS ──────────────────────────────────────
    console.log('📍 Seeding locations...');
    await queryInterface.bulkInsert('beneficiary_locations', [
      { region:'Addis Ababa', city:'Addis Ababa', woreda:'Bole' },
      { region:'Oromia', city:'Adama', woreda:'Adama 01' },
      { region:'Tigray', city:'Mekelle', woreda:'Mekelle City' },
    ]);

    // ── 7. BENEFICIARY GROUPS (head/vice, no manager) ─────────────────
    console.log('👥 Seeding beneficiary groups...');
    await queryInterface.bulkInsert('beneficiary_groups', [
      { name:'Addis Ababa Urban Poor', head_employee_id:tLead1, vice_head_employee_id:tLead2, members: JSON.stringify([tLead1, tLead2]), is_active:true, created_at:new Date(), updated_at:new Date() },
      { name:'IDP Camp Residents', head_employee_id:cAdmin, vice_head_employee_id:null, members: JSON.stringify([cAdmin]), is_active:true, created_at:new Date(), updated_at:new Date() },
    ]);
    const groups = await queryInterface.sequelize.query(`SELECT group_id, name FROM beneficiary_groups`, { type: Sequelize.QueryTypes.SELECT });
    const grp = {};
    groups.forEach(g => { grp[g.name] = g.group_id; });

    // ── 8. BENEFICIARIES ──────────────────────────────────────────────
    console.log('👨‍👩‍👧‍👦 Seeding beneficiaries...');
    await queryInterface.bulkInsert('beneficiaries', [
      { type:'organization', name:'Mekedonia Association', contact_info: JSON.stringify({ phone:'+251911234567' }), location_id:1, group_id:grp['Addis Ababa Urban Poor'], created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
      { type:'individual', name:'Mohammed Ali', contact_info: JSON.stringify({ phone:'+251922334455' }), location_id:2, group_id:grp['IDP Camp Residents'], created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
      { type:'organization', name:'Adama Orphanage', contact_info: JSON.stringify({ phone:'+251933445566' }), location_id:2, group_id:grp['Addis Ababa Urban Poor'], created_by:tLead1, created_at:new Date(), updated_at:new Date() },
      { type:'individual', name:'Fadumo Omar', contact_info: JSON.stringify({ phone:'+251966778899' }), location_id:3, group_id:grp['IDP Camp Residents'], created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
    ]);
    const benRes = await queryInterface.sequelize.query(`SELECT beneficiary_id, name FROM beneficiaries`, { type: Sequelize.QueryTypes.SELECT });
    const ben = {};
    benRes.forEach(b => { ben[b.name] = b.beneficiary_id; });

    // ── 9. BENEFICIARY TRANSFERS (optional) ────────────────────────────
    console.log('🔄 Seeding a transfer...');
    await queryInterface.bulkInsert('beneficiary_transfers', [{
      beneficiary_id: ben['Mohammed Ali'],
      from_group_id: grp['IDP Camp Residents'],
      to_group_id: grp['Addis Ababa Urban Poor'],
      reason: 'Relocation',
      transferred_by: cAdmin,
      created_at: new Date(),
    }]);
    await queryInterface.sequelize.query(`UPDATE beneficiaries SET group_id = ${grp['Addis Ababa Urban Poor']} WHERE beneficiary_id = ${ben['Mohammed Ali']}`);

    // ── 10. DONATIONS ──────────────────────────────────────────────────
    console.log('💰 Seeding donations...');
    await queryInterface.bulkInsert('donations', [
      { company_id:co['Ethio Telecom'], campaign_id:ca['Ramadan Food Drive 2026'], group_id:grp['Addis Ababa Urban Poor'], donation_date:'2026-03-15', total_value:150000.00, status:'pending', notes:'Food items for Ramadan', created_by:tLead1, created_at:new Date(), updated_at:new Date() },
      { company_id:co['Commercial Bank of Ethiopia'], campaign_id:ca['Medical Aid for IDPs'], group_id:grp['IDP Camp Residents'], donation_date:'2026-02-10', total_value:250000.00, status:'approved', approved_by:cAdmin, notes:'Financial contribution', created_by:cAdmin, created_at:new Date(), updated_at:new Date() },
      { company_id:co['Ethio Telecom'], campaign_id:ca['Medical Aid for IDPs'], group_id:grp['IDP Camp Residents'], donation_date:'2026-03-01', total_value:50000.00, status:'draft', created_by:tLead2, created_at:new Date(), updated_at:new Date() },
    ]);
    const donRes = await queryInterface.sequelize.query(`SELECT donation_id, status, company_id FROM donations ORDER BY donation_id`, { type: Sequelize.QueryTypes.SELECT });
    const don = {};
    donRes.forEach(d => { if (!don[d.status]) don[d.status] = d.donation_id; });

    // ── 11. DONATION ITEMS (per beneficiary) ────────────────────────────
    console.log('📦 Seeding donation items...');
    await queryInterface.bulkInsert('donation_items', [
      // Donation 1 (pending) - Goods for beneficiaries
      { donation_id:don['pending'], beneficiary_id:ben['Mekedonia Association'], type:'goods', description:'Flour (50kg)', quantity:100, unit_value:500, total_value:50000, status:'pending', created_at:new Date(), updated_at:new Date() },
      { donation_id:don['pending'], beneficiary_id:ben['Adama Orphanage'], type:'goods', description:'Cooking Oil (5L)', quantity:200, unit_value:300, total_value:60000, status:'pending', created_at:new Date(), updated_at:new Date() },
      // Donation 2 (approved) - Money for beneficiaries
      { donation_id:don['approved'], beneficiary_id:ben['Mohammed Ali'], type:'money', description:'Cash support', quantity:1, unit_value:100000, total_value:100000, payment_method:'cash', status:'pending', created_at:new Date(), updated_at:new Date() },
      { donation_id:don['approved'], beneficiary_id:ben['Fadumo Omar'], type:'money', description:'Cash support', quantity:1, unit_value:150000, total_value:150000, payment_method:'bank', status:'pending', created_at:new Date(), updated_at:new Date() },
    ]);
    const itemRes = await queryInterface.sequelize.query(`SELECT donation_item_id, donation_id, beneficiary_id, type FROM donation_items`, { type: Sequelize.QueryTypes.SELECT });

    // ── 12. DONATION DISTRIBUTIONS (for approved donation) ────────────
    console.log('🚚 Seeding distributions...');
    const itemApproved = itemRes.filter(i => i.donation_id === don['approved']);
    if (itemApproved.length) {
      await queryInterface.bulkInsert('donation_distributions', [
        { donation_item_id: itemApproved[0].donation_item_id, beneficiary_id: itemApproved[0].beneficiary_id, quantity:1, value:100000, created_at:new Date(), updated_at:new Date() },
        { donation_item_id: itemApproved[1].donation_item_id, beneficiary_id: itemApproved[1].beneficiary_id, quantity:1, value:150000, created_at:new Date(), updated_at:new Date() },
      ]);
    }

    // ── 13. EVIDENCE (per donation) ─────────────────────────────────────
    console.log('🖼️ Seeding evidence...');
    await queryInterface.bulkInsert('donation_distribution_evidences', [
      { donation_id: don['approved'], file_url:'/uploads/documents/charityEvidences/receipt1.pdf', file_name:'receipt1.pdf', file_type:'application/pdf', uploaded_by:cAdmin, created_at:new Date() },
      { donation_id: don['approved'], file_url:'/uploads/documents/charityEvidences/receipt2.pdf', file_name:'receipt2.pdf', file_type:'application/pdf', uploaded_by:cAdmin, created_at:new Date() },
    ]);

    // ── 14. ADJUSTMENT REQUEST (example) ──────────────────────────────
    console.log('🔧 Seeding adjustment request...');
    if (itemApproved.length) {
      await queryInterface.bulkInsert('donation_item_adjustment_requests', [{
        donation_item_id: itemApproved[0].donation_item_id,
        beneficiary_id: itemApproved[0].beneficiary_id,
        type: 'deduct',
        amount: 5000,
        reason: 'Bank charges',
        status: 'pending',
        requested_by: tLead2,
        created_at: new Date(),
        updated_at: new Date(),
      }]);
    }

    // ── 15. DONATION LOGS (approval workflow) ─────────────────────────
    console.log('📝 Seeding donation logs...');
    await queryInterface.bulkInsert('donation_logs', [
      { donation_id: don['pending'], user_id:tLead1, action:'CREATE', metadata:'{}', created_at:new Date() },
      { donation_id: don['pending'], user_id:tLead1, action:'ADD_ITEM', metadata:'{}', created_at:new Date() },
      { donation_id: don['pending'], user_id:tLead1, action:'SUBMIT_FOR_APPROVAL', metadata:'{}', created_at:new Date() },
      { donation_id: don['approved'], user_id:cAdmin, action:'CREATE', metadata:'{}', created_at:new Date() },
      { donation_id: don['approved'], user_id:cAdmin, action:'ADD_ITEM', metadata:'{}', created_at:new Date() },
      { donation_id: don['approved'], user_id:cAdmin, action:'SUBMIT_FOR_APPROVAL', metadata:'{}', created_at:new Date() },
      { donation_id: don['approved'], user_id:cAdmin, action:'APPROVE', metadata:'{}', created_at:new Date() },
    ]);

    // ── SUMMARY ─────────────────────────────────────────────────────────
    const summary = await queryInterface.sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM donation_companies) as companies,
        (SELECT COUNT(*) FROM campaigns) as campaigns,
        (SELECT COUNT(*) FROM donations) as donations,
        (SELECT COUNT(*) FROM donation_items) as items,
        (SELECT COUNT(*) FROM beneficiary_locations) as locations,
        (SELECT COUNT(*) FROM beneficiary_groups) as groups,
        (SELECT COUNT(*) FROM beneficiaries) as beneficiaries,
        (SELECT COUNT(*) FROM beneficiary_transfers) as transfers,
        (SELECT COUNT(*) FROM donation_distributions) as distributions,
        (SELECT COUNT(*) FROM donation_distribution_evidences) as evidences,
        (SELECT COUNT(*) FROM donation_item_adjustment_requests) as adjustments,
        (SELECT COUNT(*) FROM donation_logs) as logs
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\n📊 CHARITY MODULE SEED SUMMARY (v4):');
    console.log(`✅ Companies:    ${summary[0].companies}`);
    console.log(`✅ Campaigns:    ${summary[0].campaigns}`);
    console.log(`✅ Donations:    ${summary[0].donations} (pending/approved/draft)`);
    console.log(`✅ Items:        ${summary[0].items}`);
    console.log(`✅ Locations:    ${summary[0].locations}`);
    console.log(`✅ Groups:       ${summary[0].groups}`);
    console.log(`✅ Beneficiaries: ${summary[0].beneficiaries}`);
    console.log(`✅ Transfers:    ${summary[0].transfers}`);
    console.log(`✅ Distributions: ${summary[0].distributions}`);
    console.log(`✅ Evidences:    ${summary[0].evidences}`);
    console.log(`✅ Adjustments:  ${summary[0].adjustments}`);
    console.log(`✅ Logs:         ${summary[0].logs}`);
    console.log('🎉 Seeding complete!\n');
  },

  down: async (queryInterface) => {
    const tables = [
      'donation_logs',
      'donation_item_adjustment_requests',
      'donation_distribution_evidences',
      'donation_distributions',
      'donation_item_intervals',
      'donation_items',
      'donations',
      'beneficiary_transfers',
      'beneficiaries',
      'beneficiary_groups',
      'beneficiary_locations',
      'campaigns',
      'donation_companies',
    ];
    for (const t of tables) {
      await queryInterface.sequelize.query(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`);
    }
    // Optionally remove the created users/employees, but we'll leave them
  }
};