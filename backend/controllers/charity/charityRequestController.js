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

const money = (v) => Math.round(parseFloat(v || 0) * 100) / 100;

const recalcTotal = async (donationId, t) => {
  if (!donationId) return 0;
  const items = await CharityDonationItem.findAll({
    where: { donationId }, attributes: ['totalValueInBirr'], transaction: t,
  });
  const total = money(items.reduce((s, i) => s + money(i.totalValueInBirr), 0));
  await CharityDonation.update({ totalValueInBirr: total }, { where: { donationId }, transaction: t });
  return total;
};

// Sync onAdjustment array in item when a request status changes
const syncItemAdjustmentStatus = async (donationItemId, requestId, newStatus, t) => {
  if (!donationItemId) return;
  const item = await CharityDonationItem.findByPk(donationItemId, { transaction: t });
  if (!item || !Array.isArray(item.onAdjustment)) return;

  let currentAdj = [...item.onAdjustment];
  const idx = currentAdj.findIndex(a => a.adjustment_id === parseInt(requestId));
  
  if (idx !== -1) {
    if (newStatus === 'approved' || newStatus === 'rejected') {
      // Remove finalized adjustments
      currentAdj.splice(idx, 1);
    } else {
      // Update status (e.g. 'commented')
      currentAdj[idx].status = newStatus;
    }
    await item.update({ onAdjustment: currentAdj.length ? currentAdj : null }, { transaction: t });
  }
};

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

const applyAdjustmentEffects = async (request, t) => {
  const { action, metadata } = request;
  const adjustmentActions = ['Deduct', 'Increase', 'Transfer', 'Return'];
  if (!adjustmentActions.includes(action)) return;

  const { donation_item_id, recurring_id, amount, toBeneficiaryId } = metadata;
  if (!donation_item_id) return;

  const item = await CharityDonationItem.findByPk(donation_item_id, { transaction: t });
  if (!item) return;

  const isMoney = item.type === 'money';
  const adjValue = parseFloat(amount || 0);

  // Helper to update a target (either a model instance or a plain JSONB object)
  const updateValues = (target, factor = 1) => {
    // Check if target is a Sequelize model instance
    const isModel = target instanceof CharityDonationItem;

    if (isMoney) {
      const current = parseFloat(target.total_value_in_birr || target.totalValueInBirr || 0);
      const newVal = current + (adjValue * factor);
      if (isModel) {
        target.totalValueInBirr = money(newVal);
        target.unitValueInBirr = money(newVal);
      } else {
        target.total_value_in_birr = money(newVal);
        target.unit_value_in_birr = money(newVal);
      }
    } else {
      const current = parseFloat(target.quantity || 0);
      const unit = parseFloat(target.unit_value_in_birr || target.unitValueInBirr || 0);
      const newQty = current + (adjValue * factor);
      if (isModel) {
        target.quantity = newQty;
        target.totalValueInBirr = money(newQty * unit);
      } else {
        target.quantity = newQty;
        target.total_value_in_birr = money(newQty * unit);
      }
    }
  };

  if (recurring_id && item.isRecurring) {
    const isRec = JSON.parse(JSON.stringify(item.isRecurring));
    const idx = isRec.recurrings.findIndex(r => r.recurring_id === parseInt(recurring_id));
    if (idx !== -1) {
      const recItem = isRec.recurrings[idx];
      if (action === 'Return') {
        recItem.is_returned = { reason: metadata.reason || 'Returned' };
        updateValues(recItem, -1);
      } else if (action === 'Deduct') {
        updateValues(recItem, -1);
      } else if (action === 'Increase') {
        updateValues(recItem, 1);
      } else if (action === 'Transfer') {
        updateValues(recItem, -1);
      }

      item.isRecurring = isRec;
      item.totalValueInBirr = money(isRec.recurrings.reduce((s, r) => s + money(r.total_value_in_birr), 0));
      if (!isMoney) {
        item.quantity = isRec.recurrings.reduce((s, r) => s + parseFloat(r.quantity), 0);
      }
    }
  } else {
    // One-time item
    if (action === 'Return') {
      item.isReturned = { reason: metadata.reason || 'Returned' };
      item.quantity = 0;
      item.totalValueInBirr = 0;
    } else if (action === 'Deduct') {
      updateValues(item, -1);
    } else if (action === 'Increase') {
      updateValues(item, 1);
    } else if (action === 'Transfer') {
      updateValues(item, -1);
    }
  }

  await item.save({ transaction: t });

  if (action === 'Transfer' && toBeneficiaryId) {
    // Check for an existing non-recurring item for the target beneficiary
    let targetItem = await CharityDonationItem.findOne({
      where: { donationId: item.donationId, beneficiaryId: toBeneficiaryId, type: item.type, isRecurring: null },
      transaction: t
    });
    if (targetItem) {
      updateValues(targetItem, 1);
      await targetItem.save({ transaction: t });
    } else {
      await CharityDonationItem.create({
        donationId: item.donationId,
        beneficiaryId: toBeneficiaryId,
        type: item.type,
        description: item.description,
        quantity: isMoney ? 1 : adjValue,
        unitValueInBirr: isMoney ? adjValue : item.unitValueInBirr,
        totalValueInBirr: isMoney ? adjValue : money(adjValue * item.unitValueInBirr),
        paymentMethod: item.paymentMethod,
        createdBy: request.requestedBy
      }, { transaction: t });
    }
  }

  await recalcTotal(item.donationId, t);
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
    await applyAdjustmentEffects(request, t);

    // Sync onAdjustment status to the donation item
    if (request.metadata?.donation_item_id) {
      await syncItemAdjustmentStatus(request.metadata.donation_item_id, request.requestId, 'approved', t);
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

    // Sync onAdjustment status to the donation item
    if (request.metadata?.donation_item_id) {
      await syncItemAdjustmentStatus(request.metadata.donation_item_id, request.requestId, 'rejected', t);
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

    // Sync onAdjustment status to the donation item
    if (request.metadata?.donation_item_id) {
      await syncItemAdjustmentStatus(request.metadata.donation_item_id, request.requestId, 'commented', t);
    }

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
    const { action, donationItemId, recurringId, reason, metadata } = req.body;

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

    const currentAdj = Array.isArray(item.onAdjustment) ? item.onAdjustment : (item.onAdjustment ? [item.onAdjustment] : []);

    // Check if THIS specific target (item or recurring period) is already being adjusted
    const isTargetLocked = currentAdj.some(a => 
      ['pending', 'commented'].includes(a.status) && a.recurring_id === (recurringId ? parseInt(recurringId) : null)
    );

    if (isTargetLocked) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'A request is already pending for this specific period/item' });
    }

    const request = await CharityRequestApprove.create({
      action,
      requestedBy: req.user.userId,
      status: 'pending',
      metadata: {
        donation_item_id: donationItemId,
        recurring_id:     recurringId ? parseInt(recurringId) : null,
        reason:           reason || '',
        ...(metadata || {}),
      },
      comments: [],
    }, { transaction: t });

    // Mark the item as having an in-flight adjustment (including which period if recurring)
    const newOnAdj = {
      adjustment_id: request.requestId,
      status: 'pending',
      recurring_id: recurringId ? parseInt(recurringId) : null
    };

    await item.update({
      onAdjustment: [...currentAdj, newOnAdj]
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
