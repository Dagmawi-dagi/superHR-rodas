'use strict';
const {
  CharityBeneficiary, CharityTeam, CharitySetting, CharityLog,
  Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.userId;

    // Resolve team for teamleader
    let leaderTeamId = null;
    if (role === 'charity_teamleader') {
      const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
      if (emp) {
        const team = await CharityTeam.findOne({
          where: {
            isActive: true,
            [Op.or]: [
              { head: emp.employeeId },
              { vice: emp.employeeId },
              { members: { [Op.contains]: [emp.employeeId] } },
            ],
          },
          attributes: ['team_id'],
        });
        if (team) leaderTeamId = team.teamId;
      }
    }

    // 1. Beneficiary Stats
    let benWhere = {};
    if (role === 'charity_teamleader') {
      if (!leaderTeamId) {
        return res.json({ success: true, data: {
          beneficiaries: { total: 0, active: 0, inactive: 0 },
          teams: { total: 0, active: 0 },
          allocation: { totalMonthly: 0 },
          recentActivity: []
        }});
      }
      benWhere.teamId = leaderTeamId;
    }

    const [totalBens, activeBens] = await Promise.all([
      CharityBeneficiary.count({ where: benWhere }),
      CharityBeneficiary.count({ where: { ...benWhere, isActive: true } })
    ]);

    const sumAllocation = await CharityBeneficiary.sum('monthly_allocation', { where: { ...benWhere, isActive: true } });

    // 2. Team Stats
    let teamStats = { total: 0, active: 0 };
    if (['admin', 'charity_admin'].includes(role)) {
      teamStats.total = await CharityTeam.count();
      teamStats.active = await CharityTeam.count({ where: { isActive: true } });
    } else if (leaderTeamId) {
      teamStats.total = 1;
      teamStats.active = 1;
    }

    // 3. Distribution Progress (Latest Release)
    const settings = await CharitySetting.findOne({ where: { settingKey: 'main' } });
    const latestRelease = (settings?.distributionRelease || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let distributionProgress = { completed: 0, total: totalBens, release: latestRelease || null };
    if (latestRelease) {
      // deliveries is JSONB array: [{ "distribution_release_id": 123, "is_delivered": true, ... }]
      const [deliveredCount] = await sequelize.query(
        `SELECT COUNT(*) as count FROM charity_beneficiaries 
         WHERE ${role === 'charity_teamleader' ? `team_id = ${leaderTeamId} AND` : ''}
         deliveries @> :match`,
        {
          replacements: { match: JSON.stringify([{ distribution_release_id: latestRelease.distribution_release_id, is_delivered: true }]) },
          type: sequelize.QueryTypes.SELECT
        }
      );
      distributionProgress.completed = parseInt(deliveredCount.count);
    }

    // 4. Recent Activity (Logs)
    let logWhere = {};
    if (role === 'charity_teamleader' && leaderTeamId) {
       // Ideally we filter logs by targetId if target belongs to team, 
       // but for now let's just return their own logs or general module logs
       logWhere.userId = userId;
    }

    const recentLogs = await CharityLog.findAll({
      where: logWhere,
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['fullName'] }]
    });

    res.json({
      success: true,
      data: {
        beneficiaries: {
          total: totalBens,
          active: activeBens,
          inactive: totalBens - activeBens
        },
        teams: teamStats,
        allocation: {
          totalMonthly: sumAllocation || 0
        },
        distribution: distributionProgress,
        recentActivity: recentLogs
      }
    });

  } catch (err) {
    console.error('getDashboardStats Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
