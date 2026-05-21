'use strict';
const {
  CharityRequestApprove, CharityBeneficiary, CharityTeam,
  CharityDonationItem, CharityDonation, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── helpers ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const requestIncludes = [
  { model: User, as: 'requester',     attributes: ['userId', 'fullName'] },
  { model: User, as: 'assignedAdmin', attributes: ['userId', 'fullName'] },
  { model: User, as: 'approver',      attributes: ['userId', 'fullName'] },
  { model: User, as: 'rejecter',      attributes: ['userId', 'fullName'] },
];

// Apply approved/rejected transfer after admin approval
const executeTranferIfApproved = async (request, t) => {
  if (request.action !== 'TransferBeneficiary') return;
  const { beneficiary_id, charity_team_id } = request.metadata || {};
  if (beneficiary_id && charity_team_id) {
    await CharityBeneficiary.update(
      { teamId: charity_team_id },
      { where: { beneficiaryId: beneficiary_id }, transaction: t }
    );
  }
};

// ─── GET /  — list requests ───────────────────────────────────────────────────
exports.getRequests = async (req, res) => {
  try {
    const { page, size, status, action } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = {};

    if (status) where.status = status;
    if (action) where.action = action;

    // teamleaders only see their own submitted requests
    if (req.user.role === 'charity_teamleader') {
      where.requestedBy = req.user.userId;
    }

    const { count, rows } = await CharityRequestApprove.findAndCountAll({
      where, include: requestIncludes, limit, offset,
      order: [['created_at', 'DESC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getRequests:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /:id  single ─────────────────────────────────────────────────────────
exports.getRequestById = async (req, res) => {
  try {
    const req_ = await CharityRequestApprove.findByPk(req.params.id, { include: requestIncludes });
    if (!req_) return res.status(404).json({ success: false, error: 'Request not found' });
    res.json({ success: true, data: req_ });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /:id/approve  (charity_admin) ───────────────────────────────────────
exports.approveRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const request = await CharityRequestApprove.findByPk(req.params.id, { transaction: t });
    if (!request) { await t.rollback(); return res.status(404).json({ success: false, error: 'Request not found' }); }
    if (request.status !== 'pending') { await t.rollback(); return res.status(400).json({ success: false, error: `Request is already ${request.status}` }); }

    await request.update({
      status: 'approved', approvedBy: req.user.userId, reviewedAt: new Date(),
    }, { transaction: t });

    // Execute side-effects based on action
    await executeTranferIfApproved(request, t);

    // Clear onAdjustment flag on the linked donation item (if adjustment action)
    const adjustmentActions = ['Deduct', 'Increase', 'Transfer', 'Return'];
    if (adjustmentActions.includes(request.action) && request.metadata?.donation_item_id) {
      await CharityDonationItem.update(
        { onAdjustment: null },
        { where: { donationItemId: request.metadata.donation_item_id }, transaction: t }
      );
    }

    await t.commit();
    res.json({ success: true, message: 'Request approved' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /:id/reject  (charity_admin) ────────────────────────────────────────
exports.rejectRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { reason } = req.body;
    const request = await CharityRequestApprove.findByPk(req.params.id, { transaction: t });
    if (!request) { await t.rollback(); return res.status(404).json({ success: false, error: 'Request not found' }); }
    if (request.status !== 'pending') { await t.rollback(); return res.status(400).json({ success: false, error: `Request is already ${request.status}` }); }

    await request.update({
      status: 'rejected', rejectedBy: req.user.userId, reviewedAt: new Date(),
    }, { transaction: t });

    // Clear onAdjustment flag on item and add auto-comment with rejection reason
    const adjustmentActions = ['Deduct', 'Increase', 'Transfer', 'Return'];
    if (adjustmentActions.includes(request.action) && request.metadata?.donation_item_id) {
      await CharityDonationItem.update(
        { onAdjustment: null },
        { where: { donationItemId: request.metadata.donation_item_id }, transaction: t }
      );
    }

    if (reason) {
      const comments = [
        ...(request.comments || []),
        { user_id: req.user.userId, text: `Rejected: ${reason}`, created_at: new Date().toISOString() },
      ];
      await request.update({ comments }, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: 'Request rejected' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /:id/comment  (charity_admin) ───────────────────────────────────────
exports.commentRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { text } = req.body;
    if (!text?.trim()) { await t.rollback(); return res.status(400).json({ success: false, error: 'text is required' }); }

    const request = await CharityRequestApprove.findByPk(req.params.id, { transaction: t });
    if (!request) { await t.rollback(); return res.status(404).json({ success: false, error: 'Request not found' }); }

    const comments = [
      ...(request.comments || []),
      { user_id: req.user.userId, text, created_at: new Date().toISOString() },
    ];
    await request.update({ status: 'commented', comments, reviewedAt: new Date() }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Comment added', data: { comments } });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /adjustment  — teamleader submits Deduct/Increase/Transfer/Return request ──
exports.submitAdjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { action, donationItemId, recurringIntervalId, reason, metadata } = req.body;

    const validActions = ['Deduct', 'Increase', 'Transfer', 'Return'];
    if (!validActions.includes(action)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `action must be one of: ${validActions.join(', ')}` });
    }
    if (!donationItemId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'donationItemId is required' });
    }

    const item = await CharityDonationItem.findByPk(donationItemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation item not found' }); }

    // Prevent duplicate in-flight adjustment
    if (item.onAdjustment && item.onAdjustment.status === 'pending') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'An adjustment request is already pending for this item' });
    }

    const request = await CharityRequestApprove.create({
      action,
      requestedBy: req.user.userId,
      status: 'pending',
      metadata: {
        donation_item_id:      donationItemId,
        recurring_interval_id: recurringIntervalId || null,
        reason:                reason || '',
        ...(metadata || {}),
      },
      comments: [],
    }, { transaction: t });

    // Mark the item as having an in-flight adjustment
    await item.update({
      onAdjustment: { adjustment_id: request.requestId, status: 'pending' },
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Adjustment request submitted', data: request });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /stats/summary ───────────────────────────────────────────────────────
exports.getRequestStats = async (req, res) => {
  try {
    const where = req.user.role === 'charity_teamleader'
      ? { requestedBy: req.user.userId }
      : {};

    const byStatus = await CharityRequestApprove.findAll({
      where,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('request_id')), 'count']],
      group: ['status'], raw: true,
    });
    const byAction = await CharityRequestApprove.findAll({
      where,
      attributes: ['action', [sequelize.fn('COUNT', sequelize.col('request_id')), 'count']],
      group: ['action'], raw: true,
    });

    res.json({
      success: true,
      data: {
        statusBreakdown: byStatus.reduce((a, r) => { a[r.status] = parseInt(r.count); return a; }, {}),
        actionBreakdown: byAction.reduce((a, r) => { a[r.action] = parseInt(r.count); return a; }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
