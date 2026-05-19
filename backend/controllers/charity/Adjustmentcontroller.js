'use strict';
const {
  DonationItemAdjustmentRequest,
  DonationItem,
  DonationItemInterval,
  Donation,
  Beneficiary,
  BeneficiaryGroup,
  Employee,
  DonationLog,
  sequelize,
} = require('../../models');

const money = (val) => Math.round(parseFloat(val || 0) * 100) / 100;
const qty   = (val) => Math.round(parseFloat(val || 0) * 100) / 100;

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
    const { type, amount, quantity, value, reason, toBeneficiaryId, intervalId } = req.body;

    // Use specific fields if provided, otherwise fallback to generic 'amount'
    const rawVal = value !== undefined ? value : (quantity !== undefined ? quantity : amount);

    if (!type || (rawVal === undefined) || !reason) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'type, quantity/value, and reason are required' });
    }
    if (!['deduct', 'increase', 'reassign', 'return'].includes(type)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Invalid adjustment type' });
    }
    if (type === 'reassign' && !toBeneficiaryId) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'toBeneficiaryId is required for reassign' });
    }

    const parsedAmount = qty(rawVal); // This is Qty for goods, Value for money
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

    let baseLimit = (item.type === 'money') ? money(item.totalValue) : qty(item.quantity);
    if (intervalId) {
      const interval = await DonationItemInterval.findByPk(intervalId, { transaction: t });
      if (!interval) {
        await t.rollback();
        return res.status(404).json({ success: false, error: 'Interval not found' });
      }
      baseLimit = (item.type === 'money') ? money(interval.value) : qty(interval.quantity);
    }

    const employeeId = await getEmployeeIdFromUserId(req.user.userId);
    // Verify caller is head/vice of the beneficiary's group
    await assertHeadOrVice(employeeId, item.beneficiaryId);

    // Validate amount against base limit (either item or interval)
    if (['deduct', 'return', 'reassign'].includes(type) && parsedAmount > baseLimit) {
      await t.rollback();
      const label = (item.type === 'money') ? 'Value' : 'Quantity';
      return res.status(400).json({ success: false, error: `Requested ${label} (${parsedAmount}) exceeds current ${label} (${baseLimit})` });
    }

    // Enforce COMPLETE return
    if (type === 'return' && parsedAmount !== baseLimit) {
      await t.rollback();
      const label = (item.type === 'money') ? 'Value' : 'Quantity';
      return res.status(400).json({ success: false, error: `Return must be for the complete remaining ${label} (${baseLimit})` });
    }

    // Check for existing pending request on same target
    const existingPending = await DonationItemAdjustmentRequest.findOne({
      where: { 
        donationItemId: itemId, 
        intervalId: intervalId || null,
        status: 'pending' 
      },
      transaction: t,
    });
    if (existingPending) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'There is already a pending adjustment request for this target. Wait for it to be reviewed.' });
    }

    const adjustment = await DonationItemAdjustmentRequest.create({
      donationItemId:  parseInt(itemId),
      intervalId:      intervalId || null,
      beneficiaryId:   item.beneficiaryId,
      itemType:        item.type,
      type,
      quantity:        item.type === 'money' ? 1.00 : parsedAmount,
      value:           item.type === 'money' ? parsedAmount : money(parsedAmount * (item.unitValue || 0)),
      reason,
      toBeneficiaryId: toBeneficiaryId || null,
      status:          'pending',
      requestedBy:     employeeId,
    }, { transaction: t });

    await DonationLog.create({
      donationId: donation.donationId,
      userId:     employeeId,
      action:     'ADJUSTMENT_REQUESTED',
      metadata:   { 
        adjustmentId: adjustment.adjustmentId, 
        type, 
        amount: parsedAmount, 
        beneficiaryId: item.beneficiaryId,
        intervalId: intervalId || null
      },
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Adjustment request submitted for admin review', data: adjustment });
  } catch (err) {
    if (t) await t.rollback();
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
        { model: DonationItemInterval, as: 'interval' },
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

    // If approved — apply the change
    if (status === 'approved') {
      const item = adjustment.item;
      const unitVal  = parseFloat(item.unitValue) || 0;
      
      let qtyDelta = 0;
      let valDelta = 0;
      let unassignedValDelta = 0;

      // Determine deltas based on adjustment record (already has quantity/value)
      if (adjustment.itemType === 'money') {
        valDelta = parseFloat(adjustment.value);
        qtyDelta = 0; 
      } else {
        qtyDelta = parseFloat(adjustment.quantity);
        valDelta = parseFloat(adjustment.value);
      }

      // Handle specific adjustment types for the source item
      switch (adjustment.type) {
        case 'deduct':
          qtyDelta = -qtyDelta;
          valDelta = -valDelta;
          unassignedValDelta = Math.abs(valDelta);
          break;
        case 'increase':
          // qtyDelta and valDelta are already positive
          break;
        case 'return':
          qtyDelta = -qtyDelta;
          valDelta = -valDelta;
          break;
        case 'reassign':
          qtyDelta = -qtyDelta;
          valDelta = -valDelta;
          break;
      }

      // 1. Update Interval if applicable
      if (adjustment.intervalId) {
        const interval = await DonationItemInterval.findByPk(adjustment.intervalId, { transaction: t });
        if (interval) {
          const newInvQty = qty(parseFloat(interval.quantity || 0) + qtyDelta);
          const newInvVal = money(parseFloat(interval.value || 0) + valDelta);
          
          if (newInvVal < 0 || newInvQty < 0) {
            await t.rollback();
            return res.status(400).json({ success: false, error: 'Adjustment would make interval value/quantity negative' });
          }
          
          const intervalUpdates = { quantity: newInvQty, value: newInvVal };
          if (adjustment.type === 'return') {
            intervalUpdates.status = 'returned';
          }
          await interval.update(intervalUpdates, { transaction: t });
        }
      }

      // 2. Update Source Item
      const newItemQty = qty(parseFloat(item.quantity || 0) + qtyDelta);
      const newItemVal = money(parseFloat(item.totalValue || 0) + valDelta);
      const newUnassigned = money(parseFloat(item.unassignedDeduction || 0) + unassignedValDelta);

      if (newItemVal < 0 || newItemQty < 0) {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'Adjustment would make item total negative' });
      }

      const itemUpdates = { 
        quantity: newItemQty,
        totalValue: newItemVal, 
        unassignedDeduction: newUnassigned 
      };

      // Mark main item as returned ONLY if it was a direct return (not an interval return)
      if (adjustment.type === 'return' && !adjustment.intervalId) {
        itemUpdates.status = 'returned';
      }

      await item.update(itemUpdates, { transaction: t });

      // 3. Handle REASSIGNMENT Target
      if (adjustment.type === 'reassign' && adjustment.toBeneficiaryId) {
        const targetQty = Math.abs(qtyDelta);
        const targetVal = Math.abs(valDelta);

        // Find matching item for target beneficiary
        let targetItem = await DonationItem.findOne({
          where: {
            donationId: item.donationId,
            beneficiaryId: adjustment.toBeneficiaryId,
            type: item.type,
            description: item.description,
            unitValue: item.unitValue,
            status: 'pending' 
          },
          transaction: t
        });

        if (targetItem) {
          await targetItem.update({
            quantity: qty(parseFloat(targetItem.quantity) + targetQty),
            totalValue: money(parseFloat(targetItem.totalValue) + targetVal)
          }, { transaction: t });
        } else {
          targetItem = await DonationItem.create({
            donationId: item.donationId,
            beneficiaryId: adjustment.toBeneficiaryId,
            type: item.type,
            description: item.description,
            quantity: targetQty,
            unitValue: item.unitValue,
            totalValue: targetVal,
            paymentMethod: item.paymentMethod,
            distributionDate: item.distributionDate,
            isRecurring: false, 
            status: 'pending'
          }, { transaction: t });
        }
      }

      // 4. Recalculate Donation Total
      const allItems = await DonationItem.findAll({
        where: { donationId: item.donationId },
        attributes: ['totalValue'],
        transaction: t,
      });
      const newDonationTotal = money(allItems.reduce((sum, i) => sum + parseFloat(i.totalValue), 0));
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
        metadata:   { 
          adjustmentId: adjustment.adjustmentId, 
          type: adjustment.type, 
          quantity: adjustment.quantity,
          value: adjustment.value,
          adminComment,
          intervalId: adjustment.intervalId 
        },
      }, { transaction: t });
    }

    await t.commit();
    res.json({ success: true, message: `Adjustment ${status}`, data: adjustment });
  } catch (err) {
    if (t) await t.rollback();
    console.error('reviewAdjustment error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};