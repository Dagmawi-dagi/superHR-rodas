'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Add new roles if they don't exist
      const [roles] = await queryInterface.sequelize.query(
        "SELECT name FROM roles WHERE name IN ('charity_admin', 'charity_teamleader')",
        { transaction: t }
      );
      const existingRoles = roles.map(r => r.name);
      
      const rolesToInsert = [];
      if (!existingRoles.includes('charity_admin')) {
        rolesToInsert.push({
          name: 'charity_admin',
          description: 'Charity Administrator - Full access to charity module',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      if (!existingRoles.includes('charity_teamleader')) {
        rolesToInsert.push({
          name: 'charity_teamleader',
          description: 'Charity Team Leader - Access to their team beneficiaries',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      if (rolesToInsert.length > 0) {
        await queryInterface.bulkInsert('roles', rolesToInsert, { transaction: t });
      }

      // 2. Update charity_beneficiaries
      await queryInterface.renameColumn('charity_beneficiaries', 'name', 'fullname', { transaction: t });
      
      await queryInterface.addColumn('charity_beneficiaries', 'monthly_allocation', {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false
      }, { transaction: t });

      await queryInterface.addColumn('charity_beneficiaries', 'payment_method', {
        type: Sequelize.ENUM('cash', 'bank'),
        defaultValue: 'bank',
        allowNull: false
      }, { transaction: t });

      await queryInterface.addColumn('charity_beneficiaries', 'deliveries', {
        type: Sequelize.JSONB,
        defaultValue: []
      }, { transaction: t });

      await queryInterface.addColumn('charity_beneficiaries', 'adjustments', {
        type: Sequelize.JSONB,
        defaultValue: []
      }, { transaction: t });

      await queryInterface.addColumn('charity_beneficiaries', 'updated_by', {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction: t });

      await queryInterface.addColumn('charity_beneficiaries', 'deleted_by', {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction: t });

      // Change team_id to NOT NULL (Mandatory)
      // First, handle existing NULL values
      let [teams] = await queryInterface.sequelize.query(
        "SELECT team_id FROM charity_teams LIMIT 1",
        { transaction: t }
      );
      
      let teamId;
      if (teams.length === 0) {
        // Create a default team if none exist
        const [newTeam] = await queryInterface.sequelize.query(
          "INSERT INTO charity_teams (name, description, is_active, created_at, updated_at) VALUES ('Default Team', 'Automatically created default team', true, NOW(), NOW()) RETURNING team_id",
          { transaction: t }
        );
        teamId = newTeam[0].team_id;
      } else {
        teamId = teams[0].team_id;
      }

      await queryInterface.sequelize.query(
        `UPDATE charity_beneficiaries SET team_id = ${teamId} WHERE team_id IS NULL`,
        { transaction: t }
      );

      await queryInterface.changeColumn('charity_beneficiaries', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'charity_teams', key: 'team_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' 
      }, { transaction: t });

      // 3. Update charity_teams
      await queryInterface.addColumn('charity_teams', 'updated_by', {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction: t });

      await queryInterface.addColumn('charity_teams', 'deleted_by', {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'user_id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction: t });

      // 4. Update charity_settings
      await queryInterface.addColumn('charity_settings', 'distribution_release', {
        type: Sequelize.JSONB,
        defaultValue: []
      }, { transaction: t });

      await queryInterface.addColumn('charity_settings', 'defaults', {
        type: Sequelize.JSONB,
        defaultValue: {
          monthly_allocation: 3000,
          payment_method: 'bank'
        }
      }, { transaction: t });

      // 5. Create charity_logs
      await queryInterface.createTable('charity_logs', {
        log_id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true
        },
        action: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        module: {
          type: Sequelize.STRING(50),
          allowNull: false // e.g., 'beneficiary', 'team', 'setting'
        },
        target_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        details: {
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        user_id: {
          type: Sequelize.INTEGER,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('charity_logs', { transaction: t });
      
      await queryInterface.removeColumn('charity_settings', 'defaults', { transaction: t });
      await queryInterface.removeColumn('charity_settings', 'distribution_release', { transaction: t });
      
      await queryInterface.removeColumn('charity_teams', 'deleted_by', { transaction: t });
      await queryInterface.removeColumn('charity_teams', 'updated_by', { transaction: t });
      
      await queryInterface.changeColumn('charity_beneficiaries', 'team_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'charity_teams', key: 'team_id' },
      }, { transaction: t });

      await queryInterface.removeColumn('charity_beneficiaries', 'deleted_by', { transaction: t });
      await queryInterface.removeColumn('charity_beneficiaries', 'updated_by', { transaction: t });
      await queryInterface.removeColumn('charity_beneficiaries', 'adjustments', { transaction: t });
      await queryInterface.removeColumn('charity_beneficiaries', 'deliveries', { transaction: t });
      await queryInterface.removeColumn('charity_beneficiaries', 'payment_method', { transaction: t });
      await queryInterface.removeColumn('charity_beneficiaries', 'monthly_allocation', { transaction: t });
      
      await queryInterface.renameColumn('charity_beneficiaries', 'fullname', 'name', { transaction: t });

      // Note: enum and roles are not removed in down to avoid side effects
      
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
