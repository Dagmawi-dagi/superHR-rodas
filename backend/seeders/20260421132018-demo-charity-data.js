"use strict";

// This will populate:
//     5 Companies (main, sister, partner types)
//     5 Campaigns (various statuses: planned, active, completed)
//     7 Locations across Ethiopia
//     7 Beneficiaries (organizations, groups, individual)
//     5 Donations with different statuses (draft, pending, approved, distributed, cancelled)
//     6 Donation Items (money, goods)
//     4 Distributions (for completed donation)
//     3 Approval Records (pending and approved)
//     15+ Audit Logs showing the full workflow

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log("\n🎁 Starting Charity Module database seeding...");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // =============================================
      // 1. CLEAR CHARITY TABLES (in correct order)
      // =============================================
      console.log("\n🗑️  Clearing existing charity data...");

      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_logs" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_approvals" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_distributions" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "beneficiaries" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_locations" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_items" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donations" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "campaigns" RESTART IDENTITY CASCADE',
      );
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "donation_companies" RESTART IDENTITY CASCADE',
      );

      console.log("✅ Charity tables cleared");

      // =============================================
      // 2. GET EXISTING EMPLOYEE IDs FOR REFERENCES
      // =============================================
      console.log("\n👥 Fetching employee references...");

      const employees = await queryInterface.sequelize.query(
        `SELECT employee_id, first_name, last_name FROM "employees" WHERE is_active = true LIMIT 5`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const employeeMap = {};
      employees.forEach((e) => {
        employeeMap[`${e.first_name} ${e.last_name}`] = e.employee_id;
        employeeMap[e.employee_id] = e.employee_id;
      });

      // Get first employee ID for default references
      const defaultEmployeeId = employees[0]?.employee_id || 1;

      console.log(`✅ Found ${employees.length} employees for references`);

      // =============================================
      // 3. SEED donation_COMPANIES (Donors)
      // =============================================
      console.log("\n🏢 Seeding donation_companies...");

      await queryInterface.bulkInsert("donation_companies", [
        {
          name: "Ethio Telecom",
          type: "main",
          contact_info: JSON.stringify({
            email: "donations@ethiotelecom.et",
            phone: "+251111234567",
            address: "Churchill Road, Addis Ababa",
          }),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Dashen Bank",
          type: "partner",
          contact_info: JSON.stringify({
            email: "csr@dashenbank.com",
            phone: "+251115550001",
            address: "Bole Road, Addis Ababa",
          }),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Ethiopian Airlines",
          type: "sister",
          contact_info: JSON.stringify({
            email: "community@ethiopianairlines.com",
            phone: "+251116655555",
            address: "Bole International Airport",
          }),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "Awash Bank",
          type: "partner",
          contact_info: JSON.stringify({
            email: "foundation@awashbank.com",
            phone: "+251115558888",
            address: "Awash Towers, Addis Ababa",
          }),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: "MIDROC Ethiopia",
          type: "main",
          contact_info: JSON.stringify({
            email: "csr@midroc-ethiopia.com",
            phone: "+251116660000",
            address: "Wello Sefer, Addis Ababa",
          }),
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      console.log("✅ 5 donation_companies seeded");

      // =============================================
      // 4. SEED CAMPAIGNS
      // =============================================
      console.log("\n📢 Seeding campaigns...");

      await queryInterface.bulkInsert("campaigns", [
        {
          title: "Ramadan Food Drive 2026",
          description:
            "Providing food packages to families in need during Ramadan",
          category: "Food Security",
          start_date: "2026-03-01",
          end_date: "2026-04-20",
          target_amount: 500000.0,
          status: "active",
          created_by: defaultEmployeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: "Back to School 2026",
          description:
            "School supplies and uniforms for orphans and vulnerable children",
          category: "Education",
          start_date: "2026-07-01",
          end_date: "2026-09-15",
          target_amount: 300000.0,
          status: "planned",
          created_by: defaultEmployeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: "Winter Warmth 2025",
          description: "Blankets and warm clothing for displaced families",
          category: "Emergency Relief",
          start_date: "2025-11-01",
          end_date: "2025-12-31",
          target_amount: 200000.0,
          status: "completed",
          created_by: defaultEmployeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: "Medical Aid for IDPs",
          description:
            "Essential medicines and medical supplies for internally displaced persons",
          category: "Health",
          start_date: "2026-01-15",
          end_date: "2026-06-30",
          target_amount: 750000.0,
          status: "active",
          created_by: defaultEmployeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          title: "Clean Water Initiative",
          description:
            "Drilling boreholes and installing water pumps in rural communities",
          category: "Water & Sanitation",
          start_date: "2026-05-01",
          end_date: "2026-12-31",
          target_amount: 1200000.0,
          status: "active",
          created_by: defaultEmployeeId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      console.log("✅ 5 campaigns seeded");

      // =============================================
      // 5. SEED LOCATIONS
      // =============================================
      console.log("\n📍 Seeding donation locations...");

      await queryInterface.bulkInsert("donation_locations", [
        {
          region: "Addis Ababa",
          city: "Addis Ababa",
          woreda: "Bole",
          description: "Bole sub-city area",
        },
        {
          region: "Addis Ababa",
          city: "Addis Ababa",
          woreda: "Kirkos",
          description: "Kirkos sub-city",
        },
        {
          region: "Oromia",
          city: "Adama",
          woreda: "Adama 01",
          description: "Adama city center",
        },
        {
          region: "Amhara",
          city: "Bahir Dar",
          woreda: "Bahir Dar Zuria",
          description: "Rural areas around Bahir Dar",
        },
        {
          region: "Tigray",
          city: "Mekelle",
          woreda: "Mekelle City",
          description: "Urban Mekelle",
        },
        {
          region: "SNNPR",
          city: "Hawassa",
          woreda: "Hawassa City",
          description: "Hawassa city and surroundings",
        },
        {
          region: "Somali",
          city: "Jijiga",
          woreda: "Jijiga Town",
          description: "IDP camps near Jijiga",
        },
      ]);

      console.log("✅ 7 locations seeded");

      // =============================================
      // 6. GET IDs FOR REFERENCES
      // =============================================
      const donation_companies = await queryInterface.sequelize.query(
        `SELECT company_id, name FROM "donation_companies"`,
        { type: Sequelize.QueryTypes.SELECT },
      );
      const companyMap = {};
      donation_companies.forEach((c) => {
        companyMap[c.name] = c.company_id;
      });

      const campaigns = await queryInterface.sequelize.query(
        `SELECT campaign_id, title FROM "campaigns"`,
        { type: Sequelize.QueryTypes.SELECT },
      );
      const campaignMap = {};
      campaigns.forEach((c) => {
        campaignMap[c.title] = c.campaign_id;
      });

      const locations = await queryInterface.sequelize.query(
        `SELECT location_id, region, city FROM "donation_locations"`,
        { type: Sequelize.QueryTypes.SELECT },
      );
      const locationMap = {};
      locations.forEach((l) => {
        locationMap[`${l.region}-${l.city}`] = l.location_id;
      });

      // =============================================
      // 7. SEED BENEFICIARIES
      // =============================================
      console.log("\n👨‍👩‍👧‍👦 Seeding beneficiaries...");

      await queryInterface.bulkInsert("beneficiaries", [
        {
          type: "organization",
          name: "Mekedonia Humanitarian Association",
          contact_info: JSON.stringify({
            contact_person: "Abebech Gobena",
            phone: "+251911234567",
          }),
          location_id: locationMap["Addis Ababa-Addis Ababa"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "group",
          name: "Bole IDP Camp Committee",
          contact_info: JSON.stringify({
            representative: "Mohammed Ali",
            phone: "+251922334455",
          }),
          location_id: locationMap["Addis Ababa-Addis Ababa"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "organization",
          name: "Adama Orphanage Center",
          contact_info: JSON.stringify({
            director: "Worknesh Kebede",
            phone: "+251933445566",
          }),
          location_id: locationMap["Oromia-Adama"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "group",
          name: "Bahir Dar Rural Women Association",
          contact_info: JSON.stringify({
            chairperson: "Tigist Mulu",
            phone: "+251944556677",
          }),
          location_id: locationMap["Amhara-Bahir Dar"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "organization",
          name: "Mekelle Rehabilitation Center",
          contact_info: JSON.stringify({
            manager: "Gebremedhin Araya",
            phone: "+251955667788",
          }),
          location_id: locationMap["Tigray-Mekelle"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "group",
          name: "Jijiga IDP Women Group",
          contact_info: JSON.stringify({
            leader: "Fadumo Omar",
            phone: "+251966778899",
          }),
          location_id: locationMap["Somali-Jijiga"],
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          type: "individual",
          name: "Individual Beneficiaries - Hawassa",
          contact_info: JSON.stringify({
            contact: "Community Representative",
            phone: "+251977889900",
          }),
          location_id: locationMap["SNNPR-Hawassa"],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      console.log("✅ 7 beneficiaries seeded");

      // =============================================
      // 8. SEED DONATIONS (Various statuses)
      // =============================================
      console.log("\n💰 Seeding donations...");

      // Get beneficiary IDs for distributions later
      const beneficiaries = await queryInterface.sequelize.query(
        `SELECT beneficiary_id, name FROM "beneficiaries"`,
        { type: Sequelize.QueryTypes.SELECT },
      );
      const beneficiaryMap = {};
      beneficiaries.forEach((b) => {
        beneficiaryMap[b.name] = b.beneficiary_id;
      });

      // 8.1 Draft donation (incomplete, no items yet)
      await queryInterface.bulkInsert("donations", [
        {
          company_id: companyMap["Awash Bank"],
          campaign_id: campaignMap["Back to School 2026"],
          donation_date: "2026-08-01",
          total_value: 0,
          status: "draft",
          notes: "Pending confirmation of amount",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // 8.2 Pending donation (with items, awaiting approval)
      await queryInterface.bulkInsert("donations", [
        {
          company_id: companyMap["Ethio Telecom"],
          campaign_id: campaignMap["Ramadan Food Drive 2026"],
          donation_date: "2026-03-15",
          total_value: 150000.0,
          status: "pending",
          notes: "Food items donation for Ramadan",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // 8.3 Approved donation (ready for distribution)
      await queryInterface.bulkInsert("donations", [
        {
          company_id: companyMap["Dashen Bank"],
          campaign_id: campaignMap["Medical Aid for IDPs"],
          donation_date: "2026-02-10",
          total_value: 250000.0,
          status: "approved",
          notes: "Financial contribution for medical supplies",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // 8.4 Distributed donation (completed)
      await queryInterface.bulkInsert("donations", [
        {
          company_id: companyMap["Ethiopian Airlines"],
          campaign_id: campaignMap["Winter Warmth 2025"],
          donation_date: "2025-11-20",
          total_value: 80000.0,
          status: "distributed",
          notes: "Blankets and jackets distributed in November 2025",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      // 8.5 Cancelled donation
      await queryInterface.bulkInsert("donations", [
        {
          company_id: companyMap["MIDROC Ethiopia"],
          campaign_id: campaignMap["Clean Water Initiative"],
          donation_date: "2026-05-15",
          total_value: 0,
          status: "cancelled",
          notes: "Cancelled due to administrative issues",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      console.log(
        "✅ 5 donations seeded (draft, pending, approved, distributed, cancelled)",
      );

      // =============================================
      // 9. GET DONATION IDs
      // =============================================
      const donations = await queryInterface.sequelize.query(
        `SELECT donation_id, status, company_id FROM "donations" ORDER BY donation_id`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const donationMap = {};
      donations.forEach((d) => {
        const key = `${d.company_id}-${d.status}`;
        donationMap[key] = d.donation_id;
        if (!donationMap[d.status]) donationMap[d.status] = d.donation_id;
      });

      // =============================================
      // 10. SEED DONATION ITEMS
      // =============================================
      console.log("\n📦 Seeding donation items...");

      const donationItems = [];

      // Items for Pending donation (Ethio Telecom - Ramadan Food Drive)
      const pendingDonationId = donationMap["pending"];
      donationItems.push(
        {
          donation_id: pendingDonationId,
          type: "goods",
          description: "Flour (50kg bags)",
          quantity: 100,
          unit_value: 500.0,
          total_value: 50000.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          donation_id: pendingDonationId,
          type: "goods",
          description: "Cooking Oil (5L jerrycans)",
          quantity: 200,
          unit_value: 300.0,
          total_value: 60000.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          donation_id: pendingDonationId,
          type: "goods",
          description: "Dates (1kg boxes)",
          quantity: 500,
          unit_value: 80.0,
          total_value: 40000.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      );

      // Items for Approved donation (Dashen Bank - Medical Aid)
      const approvedDonationId = donationMap["approved"];
      donationItems.push({
        donation_id: approvedDonationId,
        type: "money",
        description: "Financial contribution",
        quantity: 1,
        unit_value: 250000.0,
        total_value: 250000.0,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Items for Distributed donation (Ethiopian Airlines - Winter Warmth)
      const distributedDonationId = donationMap["distributed"];
      donationItems.push(
        {
          donation_id: distributedDonationId,
          type: "goods",
          description: "Blankets",
          quantity: 200,
          unit_value: 250.0,
          total_value: 50000.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          donation_id: distributedDonationId,
          type: "goods",
          description: "Winter Jackets",
          quantity: 100,
          unit_value: 300.0,
          total_value: 30000.0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      );

      await queryInterface.bulkInsert("donation_items", donationItems);
      console.log(`✅ ${donationItems.length} donation items seeded`);

      // =============================================
      // 11. GET DONATION ITEM IDs FOR DISTRIBUTIONS
      // =============================================
      const items = await queryInterface.sequelize.query(
        `SELECT donation_item_id, donation_id, type, description FROM "donation_items"`,
        { type: Sequelize.QueryTypes.SELECT },
      );

      const itemMap = {};
      items.forEach((i) => {
        if (!itemMap[i.donation_id]) itemMap[i.donation_id] = [];
        itemMap[i.donation_id].push(i);
      });

      // =============================================
      // 12. SEED DONATION DISTRIBUTIONS
      // =============================================
      console.log("\n🚚 Seeding donation distributions...");

      const distributions = [];

      // Distribute items from distributed donation
      if (itemMap[distributedDonationId]) {
        const blanketItem = itemMap[distributedDonationId].find((i) =>
          i.description.includes("Blankets"),
        );
        const jacketItem = itemMap[distributedDonationId].find((i) =>
          i.description.includes("Jackets"),
        );

        if (blanketItem) {
          distributions.push(
            {
              donation_item_id: blanketItem.donation_item_id,
              beneficiary_id: beneficiaryMap["Mekelle Rehabilitation Center"],
              quantity: 100,
              value: 100 * 250,
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              donation_item_id: blanketItem.donation_item_id,
              beneficiary_id: beneficiaryMap["Jijiga IDP Women Group"],
              quantity: 100,
              value: 100 * 250,
              created_at: new Date(),
              updated_at: new Date(),
            },
          );
        }

        if (jacketItem) {
          distributions.push(
            {
              donation_item_id: jacketItem.donation_item_id,
              beneficiary_id: beneficiaryMap["Mekelle Rehabilitation Center"],
              quantity: 50,
              value: 50 * 300,
              created_at: new Date(),
              updated_at: new Date(),
            },
            {
              donation_item_id: jacketItem.donation_item_id,
              beneficiary_id:
                beneficiaryMap["Bahir Dar Rural Women Association"],
              quantity: 50,
              value: 50 * 300,
              created_at: new Date(),
              updated_at: new Date(),
            },
          );
        }
      }

      if (distributions.length > 0) {
        await queryInterface.bulkInsert(
          "donation_distributions",
          distributions,
        );
        console.log(`✅ ${distributions.length} distributions seeded`);
      } else {
        console.log("ℹ️ No distributions seeded");
      }

      // =============================================
      // 13. SEED DONATION APPROVALS
      // =============================================
      console.log("\n✔️ Seeding donation approvals...");

      const approvals = [];

      // Pending approval record for pending donation
      if (donationMap["pending"]) {
        approvals.push({
          donation_id: donationMap["pending"],
          approved_by: null,
          status: "pending",
          comment: null,
          created_at: new Date(),
        });
      }

      // Approved record for approved donation
      if (donationMap["approved"]) {
        approvals.push({
          donation_id: donationMap["approved"],
          approved_by: defaultEmployeeId,
          status: "approved",
          comment: "All documentation verified. Approved for distribution.",
          created_at: new Date(),
        });
      }

      // Approved record for distributed donation (historical)
      if (donationMap["distributed"]) {
        approvals.push({
          donation_id: donationMap["distributed"],
          approved_by: defaultEmployeeId,
          status: "approved",
          comment: "Approved for winter relief distribution.",
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        });
      }

      await queryInterface.bulkInsert("donation_approvals", approvals);
      console.log(`✅ ${approvals.length} approval records seeded`);

      // =============================================
      // 14. SEED DONATION LOGS (Audit Trail)
      // =============================================
      console.log("\n📝 Seeding donation logs...");

      const logs = [];
      const now = new Date();

      // Logs for pending donation
      if (donationMap["pending"]) {
        logs.push(
          {
            donation_id: donationMap["pending"],
            user_id: defaultEmployeeId,
            action: "CREATE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 5 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["pending"],
            user_id: defaultEmployeeId,
            action: "ADD_ITEM",
            metadata: JSON.stringify({ count: 3 }),
            created_at: new Date(now - 4 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["pending"],
            user_id: defaultEmployeeId,
            action: "SUBMIT_FOR_APPROVAL",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 3 * 24 * 60 * 60 * 1000),
          },
        );
      }

      // Logs for approved donation
      if (donationMap["approved"]) {
        logs.push(
          {
            donation_id: donationMap["approved"],
            user_id: defaultEmployeeId,
            action: "CREATE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 20 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["approved"],
            user_id: defaultEmployeeId,
            action: "ADD_ITEM",
            metadata: JSON.stringify({ type: "money" }),
            created_at: new Date(now - 19 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["approved"],
            user_id: defaultEmployeeId,
            action: "SUBMIT_FOR_APPROVAL",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 18 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["approved"],
            user_id: defaultEmployeeId,
            action: "APPROVE",
            metadata: JSON.stringify({ comment: "Approved" }),
            created_at: new Date(now - 17 * 24 * 60 * 60 * 1000),
          },
        );
      }

      // Logs for distributed donation
      if (donationMap["distributed"]) {
        logs.push(
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "CREATE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 60 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "ADD_ITEM",
            metadata: JSON.stringify({ count: 2 }),
            created_at: new Date(now - 59 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "SUBMIT_FOR_APPROVAL",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 58 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "APPROVE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 57 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "DISTRIBUTE_ITEM",
            metadata: JSON.stringify({ distributions: 4 }),
            created_at: new Date(now - 56 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["distributed"],
            user_id: defaultEmployeeId,
            action: "DISTRIBUTE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 55 * 24 * 60 * 60 * 1000),
          },
        );
      }

      // Logs for cancelled donation
      if (donationMap["cancelled"]) {
        logs.push(
          {
            donation_id: donationMap["cancelled"],
            user_id: defaultEmployeeId,
            action: "CREATE",
            metadata: JSON.stringify({}),
            created_at: new Date(now - 10 * 24 * 60 * 60 * 1000),
          },
          {
            donation_id: donationMap["cancelled"],
            user_id: defaultEmployeeId,
            action: "CANCEL",
            metadata: JSON.stringify({ reason: "Administrative issues" }),
            created_at: new Date(now - 9 * 24 * 60 * 60 * 1000),
          },
        );
      }

      await queryInterface.bulkInsert("donation_logs", logs);
      console.log(`✅ ${logs.length} log entries seeded`);

      // =============================================
      // 15. DISPLAY SUMMARY
      // =============================================
      const summary = await queryInterface.sequelize.query(
        `
        SELECT
          (SELECT COUNT(*) FROM donation_companies) as donation_companies,
          (SELECT COUNT(*) FROM campaigns) as campaigns,
          (SELECT COUNT(*) FROM donations) as donations,
          (SELECT COUNT(*) FROM donation_items) as donation_items,
          (SELECT COUNT(*) FROM donation_locations) as locations,
          (SELECT COUNT(*) FROM beneficiaries) as beneficiaries,
          (SELECT COUNT(*) FROM donation_distributions) as distributions,
          (SELECT COUNT(*) FROM donation_approvals) as approvals,
          (SELECT COUNT(*) FROM donation_logs) as logs
      `,
        { type: Sequelize.QueryTypes.SELECT },
      );

      console.log("\n📊 CHARITY MODULE SEED DATA SUMMARY:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`✅ donation_Companies: ${summary[0].donation_companies}`);
      console.log(`✅ Campaigns: ${summary[0].campaigns}`);
      console.log(
        `✅ Donations: ${summary[0].donations} (draft, pending, approved, distributed, cancelled)`,
      );
      console.log(`✅ Donation Items: ${summary[0].donation_items}`);
      console.log(`✅ Locations: ${summary[0].locations}`);
      console.log(`✅ Beneficiaries: ${summary[0].beneficiaries}`);
      console.log(`✅ Distributions: ${summary[0].distributions}`);
      console.log(`✅ Approval Records: ${summary[0].approvals}`);
      console.log(`✅ Audit Logs: ${summary[0].logs}`);

      console.log("\n📋 SAMPLE DATA HIGHLIGHTS:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        "• Active Campaigns: Ramadan Food Drive 2026, Medical Aid for IDPs, Clean Water Initiative",
      );
      console.log(
        "• Pending Donation: Ethio Telecom - Ramadan Food Drive (awaiting approval)",
      );
      console.log(
        "• Approved Donation: Dashen Bank - Medical Aid (ready to distribute)",
      );
      console.log(
        "• Distributed Donation: Ethiopian Airlines - Winter Warmth (completed)",
      );
      console.log("• Draft Donation: Awash Bank - Back to School (incomplete)");
      console.log(
        "• Cancelled Donation: MIDROC Ethiopia - Clean Water Initiative",
      );

      console.log("\n🔗 RELATIONSHIPS DEMONSTRATED:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("• donation_Companies linked to donations");
      console.log("• Donations linked to campaigns");
      console.log("• Donation items with proper total calculation");
      console.log("• Items distributed to beneficiaries in various locations");
      console.log("• Full approval workflow history");
      console.log("• Complete audit trail for each donation");

      console.log("\n🎉 Charity Module seed data ready ");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    } catch (error) {
      console.error("❌ Charity module seeding failed:", error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log("\n🗑️  Removing charity module data...");

    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_logs" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_approvals" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_distributions" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "beneficiaries" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_locations" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_items" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donations" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "campaigns" RESTART IDENTITY CASCADE',
    );
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE "donation_companies" RESTART IDENTITY CASCADE',
    );

    console.log("✅ Charity module data removed successfully\n");
  },
};
