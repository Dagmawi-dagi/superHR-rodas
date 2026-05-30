'use strict';
const {
  CharityDonation, CharityDonationItem, CharityBeneficiary,
  CharityTeam, CharityRequestApprove, Employee, User, sequelize,
} = require('../../models');
const { Op } = require('sequelize');

// ─── helpers ──────────────────────────────────────────────────────────────────

const paginate = (page, size) => {
  const limit  = Math.min(parseInt(size)  || 10, 100);
  const offset = ((parseInt(page) || 1) - 1) * limit;
  return { limit, offset };
};

const money = (v) => Math.round(parseFloat(v || 0) * 100) / 100;

const getCallerTeam = async (userId) => {
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  if (!emp) return null;
  return CharityTeam.findOne({
    where: {
      isActive: true,
      [Op.or]: [
        { headEmployeeId: emp.employeeId },
        { viceEmployeeId: emp.employeeId },
        { members: { [Op.contains]: [emp.employeeId] } },
      ],
    },
    attributes: ['teamId'],
  });
};

const recalcTotal = async (donationId, t) => {
  const items = await CharityDonationItem.findAll({
    where: { donationId }, attributes: ['totalValueInBirr'], transaction: t,
  });
  const total = money(items.reduce((s, i) => s + money(i.totalValueInBirr), 0));
  await CharityDonation.update({ totalValueInBirr: total }, { where: { donationId }, transaction: t });
  return total;
};

// Internal helper to get the current state of a donation batch from workflow
const getDonationWorkflowStatus = async (donationId) => {
  const lastReq = await CharityRequestApprove.findOne({
    where: { action: 'NewDonation', 'metadata.donation_id': donationId },
    order: [['created_at', 'DESC']]
  });
  if (!lastReq) return 'draft';
  if (lastReq.status === 'pending') return 'pending';
  if (lastReq.status === 'approved') return 'approved';
  if (lastReq.status === 'rejected') return 'cancelled';
  if (lastReq.status === 'commented') return 'draft'; // Feedback loop
  return 'draft';
};

const donationIncludes = [
  { model: CharityTeam, as: 'team',    attributes: ['teamId', 'name'] },
  { model: User,        as: 'creator', attributes: ['userId', 'fullName'] },
];

const itemIncludes = [
  { model: CharityBeneficiary, as: 'beneficiary', attributes: ['beneficiaryId', 'name', 'type'] },
  { model: User,               as: 'creator',     attributes: ['userId', 'fullName'] },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  DONATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /
exports.getDonations = async (req, res) => {
  try {
    const { page, size, teamId, fromDate, toDate } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = {};

    if (teamId) where.teamId = parseInt(teamId);
    if (fromDate && toDate) where.donationDeliveryDate = { [Op.between]: [fromDate, toDate] };
    else if (fromDate)      where.donationDeliveryDate = { [Op.gte]: fromDate };
    else if (toDate)        where.donationDeliveryDate = { [Op.lte]: toDate };

    if (req.user.role === 'charity_teamleader') {
      const team = await getCallerTeam(req.user.userId);
      where.teamId = team ? team.teamId : -1;
    }

    const { count, rows } = await CharityDonation.findAndCountAll({
      where, include: donationIncludes, limit, offset,
      order: [['created_at', 'DESC']], distinct: true,
    });

    // Decorate with derived status
    const decoratedRows = await Promise.all(rows.map(async (d) => {
       const status = await getDonationWorkflowStatus(d.donationId);
       return { ...d.toJSON(), status };
    }));

    res.json({
      success: true, data: decoratedRows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    console.error('getDonations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /:id  (full detail — header + all items)
exports.getDonationById = async (req, res) => {
  try {
    const donation = await CharityDonation.findByPk(req.params.id, {
      include: [
        ...donationIncludes,
        { model: CharityDonationItem, as: 'items', include: itemIncludes },
      ],
    });
    if (!donation) return res.status(404).json({ success: false, error: 'Donation not found' });

    // Derive status
    const status = await getDonationWorkflowStatus(donation.donationId);

    // Find the active NewDonation request for this donation
    const activeRequest = await CharityRequestApprove.findOne({
      where: {
        action: 'NewDonation',
        status: { [Op.in]: ['pending', 'commented'] },
        'metadata.donation_id': donation.donationId
      },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: { ...donation.toJSON(), status, activeRequest } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /  create (status: draft by default via logic)
exports.createDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { description, donationDeliveryDate, teamId, items } = req.body;

    let resolvedTeamId = teamId || null;

    if (req.user.role === 'charity_teamleader') {
      const team = await getCallerTeam(req.user.userId);
      if (!team) {
        await t.rollback();
        return res.status(403).json({ success: false, error: 'You must be a member of a team to create donations' });
      }
      resolvedTeamId = team.teamId;
    }

    const donation = await CharityDonation.create(
      { teamId: resolvedTeamId, description, donationDeliveryDate,
        totalValueInBirr: 0, createdBy: req.user.userId },
      { transaction: t }
    );

    // Initial items if provided
    if (items && Array.isArray(items)) {
      for (const itemData of items) {
        const { beneficiaryId, type, description, quantity, unitValueInBirr, paymentMethod, isRecurring } = itemData;

        const qty   = parseFloat(quantity || 0);
        const unit  = parseFloat(unitValueInBirr || 0);
        const total = isRecurring
          ? money((isRecurring.recurrings || []).reduce((s, r) => s + money(r.total_value_in_birr), 0))
          : money(qty * unit);

        await CharityDonationItem.create({
          donationId:       donation.donationId,
          beneficiaryId,
          type,
          description:      description || null,
          quantity:         isRecurring ? null : qty,
          unitValueInBirr:  unit,
          totalValueInBirr: total,
          paymentMethod:    paymentMethod || 'bank',
          isRecurring:      isRecurring   || null,
          createdBy:        req.user.userId,
        }, { transaction: t });
      }
      await recalcTotal(donation.donationId, t);
    }

    await t.commit();
    res.status(201).json({ success: true, message: 'Donation created (draft)', data: donation });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /:id  edit header (draft only)
exports.updateDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const status = await getDonationWorkflowStatus(req.params.id);
    if (status !== 'draft') {
       await t.rollback();
       return res.status(400).json({ success: false, error: 'Only draft donations can be edited' });
    }

    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }

    const updates = {};
    ['description', 'donationDeliveryDate'].forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    await donation.update(updates, { transaction: t });

    // Bulk items update if provided
    if (req.body.items && Array.isArray(req.body.items)) {
      const incomingItems = req.body.items;
      const incomingIds = incomingItems.filter(i => i.donationItemId).map(i => parseInt(i.donationItemId));

      // 1. Delete items not in incoming list
      await CharityDonationItem.destroy({
        where: {
          donationId: donation.donationId,
          donationItemId: { [Op.notIn]: incomingIds }
        },
        transaction: t
      });

      // 2. Sync incoming items
      for (const itemData of incomingItems) {
        const {
          donationItemId, beneficiaryId, type, description,
          quantity, unitValueInBirr, paymentMethod, isRecurring
        } = itemData;

        const qty   = parseFloat(quantity || 0);
        const unit  = parseFloat(unitValueInBirr || 0);
        const total = isRecurring
          ? money((isRecurring.recurrings || []).reduce((s, r) => s + money(r.total_value_in_birr), 0))
          : money(qty * unit);

        const payload = {
          beneficiaryId,
          type,
          description: description || null,
          quantity: isRecurring ? null : qty,
          unitValueInBirr: unit,
          totalValueInBirr: total,
          paymentMethod: paymentMethod || 'bank',
          isRecurring: isRecurring || null,
        };

        if (donationItemId) {
          const existing = await CharityDonationItem.findByPk(donationItemId, { transaction: t });
          if (existing && existing.donationId === donation.donationId) {
            await existing.update(payload, { transaction: t });
          }
        } else {
          await CharityDonationItem.create({
            ...payload,
            donationId: donation.donationId,
            createdBy: req.user.userId,
          }, { transaction: t });
        }
      }
    }

    await recalcTotal(donation.donationId, t);
    await t.commit();
    res.json({ success: true, message: 'Donation updated', data: donation });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /:id/submit  draft → pending (creates or updates approval request)
exports.submitDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const donationId = parseInt(req.params.id);
    const status = await getDonationWorkflowStatus(donationId);
    if (status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation is already submitted or approved' });
    }

    const donation = await CharityDonation.findByPk(donationId, {
      include: [{ model: CharityDonationItem, as: 'items' }], transaction: t,
    });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    if (!donation.items?.length) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Add at least one item before submitting' });
    }

    // Check if there is an existing 'commented' request to reuse
    const existingReq = await CharityRequestApprove.findOne({
      where: {
        action: 'NewDonation',
        status: 'commented',
        'metadata.donation_id': donation.donationId
      },
      transaction: t
    });

    if (existingReq) {
      // Reuse existing request: update status back to pending and refresh metadata
      await existingReq.update({
        status: 'pending',
        metadata: {
          ...existingReq.metadata,
          description: donation.description,
          resubmitted_at: new Date().toISOString()
        }
      }, { transaction: t });
    } else {
      // Create fresh approval request
      await CharityRequestApprove.create({
        action:      'NewDonation',
        requestedBy: req.user.userId,
        status:      'pending',
        metadata: {
          donation_id: donation.donationId,
          description: donation.description,
        },
        comments: [],
      }, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: 'Donation submitted for approval' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /:id/cancel
exports.cancelDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    
    const status = await getDonationWorkflowStatus(donation.donationId);
    if (status === 'cancelled') { await t.rollback(); return res.status(400).json({ success: false, error: 'Already cancelled' }); }

    // Logic: In the new system, "cancelling" means we should reject any active request or just mark a new state?
    // For now, if admin manually cancels, we create a 'rejected' request to finalize the state.
    await CharityRequestApprove.create({
       action: 'NewDonation',
       requestedBy: req.user.userId,
       status: 'rejected',
       approvedBy: req.user.userId,
       reviewedAt: new Date(),
       metadata: { donation_id: donation.donationId, reason: 'Manually cancelled by admin' }
    }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Donation cancelled' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DONATION ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /:id/items
exports.getItems = async (req, res) => {
  try {
    const { page, size, type, isDelivered } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = { donationId: parseInt(req.params.id) };

    if (type)                  where.type        = type;
    if (isDelivered !== undefined) where.isDelivered = isDelivered === 'true';

    // Enforce team scope for teamleaders
    if (req.user.role === 'charity_teamleader') {
      const donation = await CharityDonation.findByPk(req.params.id, { attributes: ['teamId'] });
      if (!donation) return res.status(404).json({ success: false, error: 'Donation not found' });
      const team = await getCallerTeam(req.user.userId);
      if (!team || team.teamId !== donation.teamId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
    }

    const { count, rows } = await CharityDonationItem.findAndCountAll({
      where, include: itemIncludes, limit, offset,
      order: [['created_at', 'DESC']], distinct: true,
    });

    res.json({
      success: true, data: rows,
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) || 1, pageSize: limit },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /:id/items
exports.addItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const status = await getDonationWorkflowStatus(req.params.id);
    if (status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot add items to a non-draft donation' });
    }

    const { beneficiaryId, type, description, quantity, unitValueInBirr, paymentMethod, isRecurring } = req.body;
    if (!beneficiaryId || !type) { await t.rollback(); return res.status(400).json({ success: false, error: 'beneficiaryId and type are required' }); }

    const qty   = parseFloat(quantity || 0);
    const unit  = parseFloat(unitValueInBirr || 0);
    const total = isRecurring
      ? money((isRecurring.recurrings || []).reduce((s, r) => s + money(r.total_value_in_birr), 0))
      : money(qty * unit);

    const item = await CharityDonationItem.create({
      donationId:       parseInt(req.params.id),
      beneficiaryId:    parseInt(beneficiaryId),
      type,
      description:      description || null,
      quantity:         qty  || null,
      unitValueInBirr:  unit || null,
      totalValueInBirr: total,
      paymentMethod:    paymentMethod || 'bank',
      isRecurring:      isRecurring   || null,
      isReturned:       null,
      isDelivered:      false,
      bankReceipts:     [],
      onAdjustment:     null,
      createdBy:        req.user.userId,
    }, { transaction: t });

    await recalcTotal(req.params.id, t);
    await t.commit();
    res.status(201).json({ success: true, message: 'Item added', data: item });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /items/:itemId
exports.updateItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }

    const status = await getDonationWorkflowStatus(item.donationId);
    if (status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation is not editable' });
    }

    const updates = {};
    ['description', 'quantity', 'unitValueInBirr', 'paymentMethod', 'isRecurring', 'beneficiaryId']
      .forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.isRecurring) {
      updates.totalValueInBirr = money((updates.isRecurring.recurrings || []).reduce((s, r) => s + money(r.total_value_in_birr), 0));
    } else if (updates.quantity !== undefined || updates.unitValueInBirr !== undefined) {
      const qty  = parseFloat(updates.quantity        ?? item.quantity        ?? 0);
      const unit = parseFloat(updates.unitValueInBirr ?? item.unitValueInBirr ?? 0);
      updates.totalValueInBirr = money(qty * unit);
    }

    await item.update(updates, { transaction: t });
    await recalcTotal(item.donationId, t);
    await t.commit();
    res.json({ success: true, message: 'Item updated', data: item });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /items/:itemId
exports.deleteItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }

    const status = await getDonationWorkflowStatus(item.donationId);
    if (status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Cannot delete item after submission' });
    }

    const donationId = item.donationId;
    await item.destroy({ transaction: t });
    await recalcTotal(donationId, t);
    await t.commit();
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/receipts
exports.uploadReceipts = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const files = req.files;
    if (!files?.length) { await t.rollback(); return res.status(400).json({ success: false, error: 'No files uploaded' }); }
    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }

    const newUrls  = files.map(f => `/uploads/documents/charityEvidences/${f.filename}`);
    const existing = Array.isArray(item.bankReceipts) ? item.bankReceipts : [];
    await item.update({ bankReceipts: [...existing, ...newUrls] }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: `${files.length} receipt(s) uploaded`, data: item.bankReceipts });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/deliver
exports.markDelivered = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }

    const status = await getDonationWorkflowStatus(item.donationId);
    if (status !== 'approved') { await t.rollback(); return res.status(400).json({ success: false, error: 'Donation must be approved' }); }
    if (item.isDelivered) { await t.rollback(); return res.status(400).json({ success: false, error: 'Already marked' }); }

    await item.update({ isDelivered: true }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Item marked as delivered' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/return
exports.returnItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { reason } = req.body;
    if (!reason?.trim()) { await t.rollback(); return res.status(400).json({ success: false, error: 'reason is required' }); }

    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }
    if (item.isReturned) { await t.rollback(); return res.status(400).json({ success: false, error: 'Item already returned' }); }

    await item.update({ isReturned: { reason }, isDelivered: false }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Item marked as returned' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/reassign
exports.reassignItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryId, reason, recurringId } = req.body;
    if (!beneficiaryId) { await t.rollback(); return res.status(400).json({ success: false, error: 'beneficiaryId is required' }); }
    const item = await CharityDonationItem.findByPk(req.params.itemId, { transaction: t });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }

    let isTargetReturned = false;
    if (recurringId && item.isRecurring) {
      const rec = item.isRecurring.recurrings.find(r => r.recurring_id === parseInt(recurringId));
      isTargetReturned = !!(rec && rec.is_returned);
    } else isTargetReturned = !!item.isReturned;

    if (!isTargetReturned) { await t.rollback(); return res.status(400).json({ success: false, error: 'Target item/period is not returned' }); }

    const newBen = await CharityBeneficiary.findByPk(beneficiaryId, { transaction: t });
    if (!newBen) { await t.rollback(); return res.status(404).json({ success: false, error: 'Target beneficiary not found' }); }

    const currentAdj = Array.isArray(item.onAdjustment) ? item.onAdjustment : (item.onAdjustment ? [item.onAdjustment] : []);
    const isLocked = currentAdj.some(a => ['pending', 'commented'].includes(a.status) && a.recurring_id === (recurringId ? parseInt(recurringId) : null));
    if (isLocked) { await t.rollback(); return res.status(400).json({ success: false, error: 'Already pending adjustment' }); }

    const request = await CharityRequestApprove.create({
      action: 'Reassign', requestedBy: req.user.userId, status: 'pending',
      metadata: { donation_item_id: item.donationItemId, recurring_id: recurringId ? parseInt(recurringId) : null, from_beneficiary_id: item.beneficiaryId, to_beneficiary_id: parseInt(beneficiaryId), reason: reason || 'Reassigned' },
      comments: [],
    }, { transaction: t });

    await item.update({ onAdjustment: [...currentAdj, { adjustment_id: request.requestId, status: 'pending', action: 'Reassign', recurring_id: recurringId ? parseInt(recurringId) : null }] }, { transaction: t });

    await t.commit();
    res.json({ success: true, message: 'Reassignment request submitted' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── GET /stats/summary ───────────────────────────────────────────────────────
exports.getDonationStats = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'charity_teamleader') {
      const team = await getCallerTeam(req.user.userId);
      where.teamId = team ? team.teamId : -1;
    }

    const [total, totalValue] = await Promise.all([
      CharityDonation.count({ where }),
      CharityDonation.sum('total_value_in_birr', { where }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        totalValue: money(totalValue || 0),
        statusBreakdown: {}, // status column removed from DB
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
