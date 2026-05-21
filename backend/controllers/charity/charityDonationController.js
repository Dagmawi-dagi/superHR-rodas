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
    const { page, size, status, teamId, fromDate, toDate } = req.query;
    const { limit, offset } = paginate(page, size);
    const where = {};

    if (status) where.status = status;
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

    res.json({
      success: true, data: rows,
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
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /  create (status: draft)
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
        status: 'draft', totalValueInBirr: 0, createdBy: req.user.userId },
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
    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    if (donation.status !== 'draft') { await t.rollback(); return res.status(400).json({ success: false, error: 'Only draft donations can be edited' }); }

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

// POST /:id/submit  draft → pending
exports.submitDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const donation = await CharityDonation.findByPk(req.params.id, {
      include: [{ model: CharityDonationItem, as: 'items' }], transaction: t,
    });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    if (donation.status !== 'draft') { await t.rollback(); return res.status(400).json({ success: false, error: 'Donation is not in draft' }); }
    if (!donation.items?.length) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Add at least one item before submitting' });
    }

    await donation.update({ status: 'pending' }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Donation submitted for approval' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /:id/approve  pending → approved  (charity_admin)
exports.approveDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    if (donation.status !== 'pending') { await t.rollback(); return res.status(400).json({ success: false, error: 'Donation is not pending' }); }

    await donation.update({ status: 'approved' }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Donation approved' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /:id/cancel  any → cancelled
exports.cancelDonation = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation) { await t.rollback(); return res.status(404).json({ success: false, error: 'Donation not found' }); }
    if (donation.status === 'cancelled') { await t.rollback(); return res.status(400).json({ success: false, error: 'Already cancelled' }); }

    await donation.update({ status: 'cancelled' }, { transaction: t });
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

// GET /:id/items  — list items of a donation
// charity_teamleader: only sees items of their own team's donations
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

// POST /:id/items  — add item (draft only)
exports.addItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { beneficiaryId, type, description, quantity, unitValueInBirr, paymentMethod, isRecurring } = req.body;

    if (!beneficiaryId || !type) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'beneficiaryId and type are required' });
    }

    const donation = await CharityDonation.findByPk(req.params.id, { transaction: t });
    if (!donation || donation.status !== 'draft') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Donation not found or not in draft' });
    }

    const ben = await CharityBeneficiary.findByPk(beneficiaryId, { transaction: t });
    if (!ben) { await t.rollback(); return res.status(404).json({ success: false, error: 'Beneficiary not found' }); }

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

// PUT /items/:itemId  — edit item (draft only)
exports.updateItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, {
      include: [{ model: CharityDonation, as: 'donation', attributes: ['status', 'donationId'] }],
      transaction: t,
    });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }
    if (item.donation.status !== 'draft') { await t.rollback(); return res.status(400).json({ success: false, error: 'Donation is not editable' }); }

    const updates = {};
    ['description', 'quantity', 'unitValueInBirr', 'paymentMethod', 'isRecurring', 'beneficiaryId']
      .forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Recalculate total
    if (updates.isRecurring) {
      updates.totalValueInBirr = money((updates.isRecurring.recurrings || []).reduce((s, r) => s + money(r.total_value_in_birr), 0));
    } else if (updates.quantity !== undefined || updates.unitValueInBirr !== undefined) {
      const qty  = parseFloat(updates.quantity        ?? item.quantity        ?? 0);
      const unit = parseFloat(updates.unitValueInBirr ?? item.unitValueInBirr ?? 0);
      updates.totalValueInBirr = money(qty * unit);
    }

    await item.update(updates, { transaction: t });
    await recalcTotal(item.donation.donationId, t);
    await t.commit();
    res.json({ success: true, message: 'Item updated', data: item });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /items/:itemId  — soft-delete (draft only)
exports.deleteItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, {
      include: [{ model: CharityDonation, as: 'donation', attributes: ['status', 'donationId'] }],
      transaction: t,
    });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }
    if (item.donation.status !== 'draft') { await t.rollback(); return res.status(400).json({ success: false, error: 'Cannot delete item after submission' }); }

    const donationId = item.donation.donationId;
    await item.destroy({ transaction: t }); // paranoid soft-delete
    await recalcTotal(donationId, t);
    await t.commit();
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/receipts  — upload bank receipts
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

// POST /items/:itemId/deliver  — set is_delivered: true (approved donations)
exports.markDelivered = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const item = await CharityDonationItem.findByPk(req.params.itemId, {
      include: [{ model: CharityDonation, as: 'donation', attributes: ['status'] }],
      transaction: t,
    });
    if (!item) { await t.rollback(); return res.status(404).json({ success: false, error: 'Item not found' }); }
    if (item.donation.status !== 'approved') { await t.rollback(); return res.status(400).json({ success: false, error: 'Donation must be approved before marking delivery' }); }
    if (item.isDelivered) { await t.rollback(); return res.status(400).json({ success: false, error: 'Item already marked as delivered' }); }

    await item.update({ isDelivered: true }, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Item marked as delivered' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /items/:itemId/return  — set is_returned: { reason }
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

// ─── GET /stats/summary ───────────────────────────────────────────────────────
exports.getDonationStats = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'charity_teamleader') {
      const team = await getCallerTeam(req.user.userId);
      where.teamId = team ? team.teamId : -1;
    }

    const [total, byStatus, totalValue] = await Promise.all([
      CharityDonation.count({ where }),
      CharityDonation.findAll({
        where,
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('donation_id')), 'count']],
        group: ['status'], raw: true,
      }),
      CharityDonation.sum('total_value_in_birr', { where: { ...where, status: { [Op.notIn]: ['cancelled'] } } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        totalValue: money(totalValue || 0),
        statusBreakdown: byStatus.reduce((acc, r) => { acc[r.status] = parseInt(r.count); return acc; }, {}),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
