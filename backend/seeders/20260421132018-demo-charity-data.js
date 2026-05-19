'use strict';
const bcrypt = require('bcryptjs');

/**
 * Seeder: Charity Roles
 *
 * Seeds:
 *   - 2 roles:     charity_admin, charity_teamleader
 *   - 3 users:     charity.admin | team_lead_1 | team_lead_2
 *   - 3 employees: one per user (EMP-CA01, EMP-TL01, EMP-TL02)
 *   - 1 charity_settings row (main) with 2 seeded companies
 *
 * Safe to run after the HR demo seeder (20260224185643-demo-data.js).
 * Uses ON CONFLICT DO NOTHING for roles and INSERT … WHERE NOT EXISTS for
 * users / employees so it is idempotent — re-running will not duplicate data.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('\n🎁  Seeding charity roles, users & employees...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ── 1. ROLES ───────────────────────────────────────────────────────────────
    console.log('\n📋 Seeding charity roles...');
    await queryInterface.sequelize.query(`
      INSERT INTO roles (name, description, is_active, created_at, updated_at)
      VALUES
        ('charity_admin',      'Charity Administrator — full charity module access', true, NOW(), NOW()),
        ('charity_teamleader', 'Charity Team Leader — creates and manages donations for their team', true, NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);

    // Resolve role IDs (may have just been inserted or already existed)
    const [roleRows] = await queryInterface.sequelize.query(
      `SELECT role_id, name FROM roles WHERE name IN ('charity_admin', 'charity_teamleader')`
    );
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.name] = r.role_id; });

    const adminRoleId = roleMap['charity_admin'];
    const tlRoleId    = roleMap['charity_teamleader'];
    if (!adminRoleId || !tlRoleId) throw new Error('Charity roles not found after insert.');
    console.log(`  ✅ charity_admin (id=${adminRoleId})  charity_teamleader (id=${tlRoleId})`);

    // ── 2. DEPARTMENT reference ────────────────────────────────────────────────
    // We attach charity users to HR dept — change to whatever fits your org.
    const [deptRows] = await queryInterface.sequelize.query(
      `SELECT department_id FROM departments WHERE name = 'Human Resources' LIMIT 1`
    );
    const hrDeptId = deptRows[0]?.department_id;
    if (!hrDeptId) throw new Error('Human Resources department not found — run HR seeder first.');

    // ── 3. POSITION reference ──────────────────────────────────────────────────
    const [posRows] = await queryInterface.sequelize.query(
      `SELECT position_id FROM positions LIMIT 1`
    );
    const posId = posRows[0]?.position_id;
    if (!posId) throw new Error('No positions found — run HR seeder first.');

    // ── 4. USERS ───────────────────────────────────────────────────────────────
    console.log('\n👤 Seeding charity users...');
    const passwordHash = await bcrypt.hash('Charity@1234', 10);

    const usersToSeed = [
      {
        username:      'charity_admin',
        email:         'charity.admin@superhr.et',
        full_name:     'Dagmawi Hadgu',
        role_id:       adminRoleId,
        employee_code: 'EMP-CA01',
        first_name:    'Dagmawi',
        last_name:     'Hadgu',
        middle_name:   'Tesfaye',
        gender:        'male',
        dob:           '1988-04-12',
        phone:         '+251912000091',
        work_email:    'dagmawi.hadgu@superhr.et',
        hire_date:     '2022-01-10',
      },
      {
        username:      'team_lead_1',
        email:         'team.lead1@superhr.et',
        full_name:     'Birtukan Alemu',
        role_id:       tlRoleId,
        employee_code: 'EMP-TL01',
        first_name:    'Birtukan',
        last_name:     'Alemu',
        middle_name:   null,
        gender:        'female',
        dob:           '1992-07-23',
        phone:         '+251913000092',
        work_email:    'birtukan.alemu@superhr.et',
        hire_date:     '2023-03-01',
      },
      {
        username:      'team_lead_2',
        email:         'team.lead2@superhr.et',
        full_name:     'Yohannes Tesfaye',
        role_id:       tlRoleId,
        employee_code: 'EMP-TL02',
        first_name:    'Yohannes',
        last_name:     'Tesfaye',
        middle_name:   'Girma',
        gender:        'male',
        dob:           '1990-11-05',
        phone:         '+251914000093',
        work_email:    'yohannes.tesfaye@superhr.et',
        hire_date:     '2023-03-01',
      },
    ];

    for (const u of usersToSeed) {
      // ── insert user if not exists ──
      await queryInterface.sequelize.query(`
        INSERT INTO users (username, email, password_hash, full_name, role_id, department_id, is_active, created_at, updated_at)
        SELECT :username, :email, :password_hash, :full_name, :role_id, :department_id, true, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = :username);
      `, {
        replacements: {
          username:      u.username,
          email:         u.email,
          password_hash: passwordHash,
          full_name:     u.full_name,
          role_id:       u.role_id,
          department_id: hrDeptId,
        },
      });

      console.log(`  ✅ user: ${u.username} (${u.full_name})`);
    }

    // ── 5. EMPLOYEES ───────────────────────────────────────────────────────────
    console.log('\n🧑‍💼 Seeding charity employees...');

    // Re-fetch user IDs (may have been pre-existing)
    const [userRows] = await queryInterface.sequelize.query(
      `SELECT user_id, username FROM users WHERE username IN ('charity_admin','team_lead_1','team_lead_2')`
    );
    const userMap = {};
    userRows.forEach(u => { userMap[u.username] = u.user_id; });

    for (const u of usersToSeed) {
      const userId = userMap[u.username];
      if (!userId) continue; // safety

      await queryInterface.sequelize.query(`
        INSERT INTO employees (
          employee_code, user_id, first_name, last_name, middle_name,
          date_of_birth, gender, work_email, phone_number,
          hire_date, employment_type, employment_status,
          department_id, position_id, created_at, updated_at
        )
        SELECT
          :employee_code, :user_id, :first_name, :last_name, :middle_name,
          :date_of_birth, :gender, :work_email, :phone_number,
          :hire_date, 'full-time', 'active',
          :department_id, :position_id, NOW(), NOW()
        WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_code = :employee_code);
      `, {
        replacements: {
          employee_code: u.employee_code,
          user_id:       userId,
          first_name:    u.first_name,
          last_name:     u.last_name,
          middle_name:   u.middle_name,
          date_of_birth: u.dob,
          gender:        u.gender,
          work_email:    u.work_email,
          phone_number:  u.phone,
          hire_date:     u.hire_date,
          department_id: hrDeptId,
          position_id:   posId,
        },
      });

      console.log(`  ✅ employee: ${u.employee_code} → ${u.first_name} ${u.last_name}`);
    }

    // ── 6. CHARITY SETTINGS (default row) ─────────────────────────────────────
    console.log('\n⚙️  Seeding charity_settings (main)...');

    // Get the charity_admin user_id for updated_by
    const charityAdminUserId = userMap['charity_admin'];

    const defaultCompanies = JSON.stringify([
      {
        name: 'Ethio Telecom',
        full_info: {
          type:    'main',
          phone:   '+251115517777',
          email:   'csr@ethiotelecom.et',
          address: 'Churchill Ave, Addis Ababa',
        },
      },
      {
        name: 'Commercial Bank of Ethiopia',
        full_info: {
          type:    'partner',
          phone:   '+251115511271',
          email:   'csr@combanketh.et',
          address: 'Gambia St, Addis Ababa',
        },
      },
    ]);

    await queryInterface.sequelize.query(`
      INSERT INTO charity_settings (setting_key, companies, config, updated_by, created_at, updated_at)
      SELECT 'main', :companies::jsonb, '{}'::jsonb, :updated_by, NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM charity_settings WHERE setting_key = 'main');
    `, {
      replacements: {
        companies:  defaultCompanies,
        updated_by: charityAdminUserId,
      },
    });

    console.log('  ✅ charity_settings (main) seeded');

    console.log('\n✅  Charity seeder complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Credentials (all users):  password = Charity@1234');
    console.log('  charity_admin  →  charity.admin@superhr.et');
    console.log('  team_lead_1    →  team.lead1@superhr.et');
    console.log('  team_lead_2    →  team.lead2@superhr.et');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },


  async down(queryInterface, Sequelize) {
    console.log('\n🗑️  Rolling back charity seeder...');

    // Remove employees first (FK → users)
    await queryInterface.sequelize.query(`
      DELETE FROM employees WHERE employee_code IN ('EMP-CA01','EMP-TL01','EMP-TL02');
    `);

    // Remove users
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE username IN ('charity_admin','team_lead_1','team_lead_2');
    `);

    // Remove roles
    await queryInterface.sequelize.query(`
      DELETE FROM roles WHERE name IN ('charity_admin','charity_teamleader');
    `);

    // Remove settings row
    await queryInterface.sequelize.query(`
      DELETE FROM charity_settings WHERE setting_key = 'main';
    `);

    console.log('✅  Charity seeder rolled back.');
  },
};