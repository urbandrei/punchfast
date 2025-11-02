'use strict';

const { Op } = require('sequelize');
const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

const GOAL = parseInt(process.env.PUNCH_GOAL || '10', 10);

/**
 * POST /api/punch
 * Body:
 *   - customer_username: string   (required)
 *   - business_username: string   (preferred; business email or username)
 *   - businessEmail: string       (optional legacy key; same value as above)
 */
exports.punch = async (req, res) => {
  try {
    const { customer_username, business_username, businessEmail } = req.body || {};

    const customerUsername = String(customer_username || '')
      .trim()
      .toLowerCase();
    const bizId = String(business_username || businessEmail || '')
      .trim()
      .toLowerCase();

    if (!customerUsername || !bizId) {
      return res
        .status(400)
        .json({ message: 'Missing customer_username or business identifier.' });
    }

    // Find the business by email OR username
    const business = await Business.findOne({
      where: {
        [Op.or]: [{ email: bizId }, { username: bizId }],
      },
    });

    if (!business) {
      return res.status(404).json({ message: 'Business Not Found.' });
    }

    // Canonical business key to store on the punchcard (email preferred; fall back to username)
    const businessUsername = String(
      (business.email && business.email.toLowerCase()) ||
      (business.username && business.username.toLowerCase()) ||
      bizId
    );

    // Ensure one row per (business, customer)
    const [card, created] = await Punchcard.findOrCreate({
      where: { customerUsername, businessUsername },
      defaults: { punches: 0 },
    });

    // Increment; reset to 0 if goal reached
    let punches = (card.punches || 0) + 1;
    let message;

    if (punches >= GOAL) {
      punches = 0; // reset after reward
      await card.update({ punches });
      message = 'Goal reached! Card reset.';
    } else {
      await card.update({ punches });
      message = created ? 'New customer. Punch recorded.' : 'Punch recorded.';
    }

    const remaining = GOAL - punches;

    return res.status(200).json({
      message,
      punches,
      remaining,
      goal: GOAL,
    });
  } catch (err) {
    console.error('Punch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
