'use strict';
const {
  DonationItemAdjustmentRequest,
  DonationItem,
  Donation,
  Beneficiary,
  BeneficiaryGroup,
  Employee,
  DonationLog,
  sequelize,
} = require('../../models');

const money = (val) => Math.round(parseFloat(val || 0) * 100) / 100;

const getEmployeeIdFromUserId = async (userId) => {
  if (!userId) return null;
  const emp = await Employee.findOne({ where: { userId }, attributes: ['employeeId'] });
  return emp ? emp.employeeId : null;
};

// Verify that the caller is head or vice of the group the item/beneficiary belongs to
const assertHeadOrVice = async (employeeId, beneficiaryId) => {
  const ben = await Beneficiary.findByPk(beneficiaryId, { attributes: ['groupId'] });
  if (!ben || !ben.groupId) throw new Error('Beneficiary has no group assigned');
  const group = await BeneficiaryGroup.findByPk(ben.groupId);
  if (!group) throw new Error('Beneficiary group not found');
  if (group.headEmployeeId !== employeeId && group.viceHeadEmployeeId !== employeeId) {
    throw new Error('Only the group head or vice-head can request adjustments');
  }
  return group;
};

// ── POST /donations/items/:itemId/adjustments ─────────────────────────────────
// charity_teamleader: request a deduct / increase / reassign / return
exports.requestAdjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { itemId } = req.params;
    const { type, amount, reason, toBeneficiaryId } = req.body;

    if (!type || !amount || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'type, amount, and reason are required' });
    }
    if (!['deduct', 'increase', 'reassign', 'return'].includes(type)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid adjustment type' });
    }
    if (type === 'reassign' && !toBeneficiaryId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'toBeneficiaryId is required for reassign' });
    }

    const parsedAmount = money(amount);
    if (parsedAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Amount must be greater than zero' });
    }

    const item = await DonationItem.findByPk(itemId, { transaction: t });
    if (!item) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Donation item not found' });
    }

    // Only allowed on approved donations
    const donation = await Donation.findByPk(item.donationId, { transaction: t });
    if (!donation || donation.status !== 'approved') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Adjustments can only be requested on approved donations' });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    // Verify caller is head/vice of the beneficiary's group
    await assertHeadOrVice(employeeId, item.beneficiaryId);

    // Validate amount against item total
    if (['deduct', 'return'].includes(type) && parsedAmount > money(item.totalValue)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: `Amount (${parsedAmount}) exceeds item total value (${money(item.totalValue)})` });
    }

    // Check for existing pending request on same item
    const existingPending = await DonationItemAdjustmentRequest.findOne({
      where: { donationItemId: itemId, status: 'pending' },
      transaction: t,
    });
    if (existingPending) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'There is already a pending adjustment request for this item. Wait for it to be reviewed.' });
    }

    const adjustment = await DonationItemAdjustmentRequest.create({
      donationItemId:  parseInt(itemId),
      beneficiaryId:   item.beneficiaryId,
      type,
      amount:          parsedAmount,
      reason,
      toBeneficiaryId: toBeneficiaryId || null,
      status:          'pending',
      requestedBy:     employeeId,
    }, { transaction: t });

    await DonationLog.create({
      donationId: donation.donationId,
      userId:     employeeId,
      action:     'ADJUSTMENT_REQUESTED',
      metadata:   { adjustmentId: adjustment.adjustmentId, type, amount: parsedAmount, beneficiaryId: item.beneficiaryId },
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Adjustment request submitted for admin review', data: adjustment });
  } catch (err) {
    await t.rollback();
    console.error('requestAdjustment error:', err);
    res.status(err.message.includes('Only the group') || err.message.includes('Beneficiary') ? 403 : 500)
      .json({ success: false, error: err.message });
  }
};

// ── GET /donations/items/:itemId/adjustments ──────────────────────────────────
exports.getItemAdjustments = async (req, res) => {
  try {
    const adjustments = await DonationItemAdjustmentRequest.findAll({
      where: { donationItemId: req.params.itemId },
      include: [
        { model: Beneficiary,  as: 'beneficiary',   attributes: ['beneficiaryId', 'name'] },
        { model: Beneficiary,  as: 'toBeneficiary',  attributes: ['beneficiaryId', 'name'] },
        { model: Employee,     as: 'requester',      attributes: ['employeeId', 'firstName', 'lastName'] },
        { model: Employee,     as: 'reviewer',       attributes: ['employeeId', 'firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: adjustments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /donations/adjustments/pending — charity_admin: all pending requests ──
exports.getAllPendingAdjustments = async (req, res) => {
  try {
    const adjustments = await DonationItemAdjustmentRequest.findAll({
      where: { status: 'pending' },
      include: [
        { model: DonationItem, as: 'item', include: [{ model: Donation }] },
        { model: Beneficiary,  as: 'beneficiary',   attributes: ['beneficiaryId', 'name'] },
        { model: Beneficiary,  as: 'toBeneficiary',  attributes: ['beneficiaryId', 'name'] },
        { model: Employee,     as: 'requester',      attributes: ['employeeId', 'firstName', 'lastName'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: adjustments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── PUT /donations/adjustments/:id/review — charity_admin: approve or reject ──
exports.reviewAdjustment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'status must be "approved" or "rejected"' });
    }

    const adjustment = await DonationItemAdjustmentRequest.findByPk(id, {
      include: [{ model: DonationItem, as: 'item' }],
      transaction: t,
    });
    if (!adjustment) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Adjustment request not found' });
    }
    if (adjustment.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'This request has already been reviewed' });
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);

    // If approved — apply the change to the donation item
    if (status === 'approved') {
      const item = adjustment.item;
      const currentTotal = money(item.totalValue);
      const amt          = money(adjustment.amount);
      let newTotal = currentTotal;

      switch (adjustment.type) {
        case 'deduct':
          newTotal = money(currentTotal - amt);
          if (newTotal < 0) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Deduction would make item total negative' });
          }
          await item.update({ totalValue: newTotal, unassignedDeduction: money(money(item.unassignedDeduction) + amt) }, { transaction: t });
          break;

        case 'increase':
          newTotal = money(currentTotal + amt);
          await item.update({ totalValue: newTotal }, { transaction: t });
          break;

        case 'return':
          newTotal = money(currentTotal - amt);
          if (newTotal < 0) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Return would make item total negative' });
          }
          await item.update({ totalValue: newTotal }, { transaction: t });
          break;

        case 'reassign':
          // Move the amount from this item to the target beneficiary's item (or unassigned pool)
          await item.update({
            totalValue:          money(currentTotal - amt),
            unassignedDeduction: money(money(item.unassignedDeduction) + amt),
          }, { transaction: t });
          break;
      }

      // Recalculate donation total
      const allItems = await DonationItem.findAll({
        where: { donationId: item.donationId },
        attributes: ['totalValue'],
        transaction: t,
      });
      const newDonationTotal = money(allItems.reduce((sum, i) => sum + money(i.totalValue), 0));
      await Donation.update({ totalValue: newDonationTotal }, { where: { donationId: item.donationId }, transaction: t });
    }

    // Update the request itself
    await adjustment.update({ status, adminComment: adminComment || null, reviewedBy: employeeId }, { transaction: t });

    // Log
    const donation = await Donation.findByPk(adjustment.item?.donationId, { transaction: t });
    if (donation) {
      await DonationLog.create({
        donationId: donation.donationId,
        userId:     employeeId,
        action:     `ADJUSTMENT_${status.toUpperCase()}`,
        metadata:   { adjustmentId: adjustment.adjustmentId, type: adjustment.type, amount: adjustment.amount, adminComment },
      }, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: `Adjustment ${status}`, data: adjustment });
  } catch (err) {
    await t.rollback();
    console.error('reviewAdjustment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};