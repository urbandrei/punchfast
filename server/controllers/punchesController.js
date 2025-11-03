'use strict';

const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

// configurable goal, defaults to 10
const GOAL = parseInt(process.env.PUNCH_GOAL || '10', 10);

exports.punch = async (req, res) => {
  try {
    // Accept either business_username or businessEmail from the client.
    // We treat this value as the business's EMAIL (identifier).
    const rawBiz =
      req.body.businessEmail ||
      req.body.business_username ||
      req.body.business ||
      '';

    const rawCust = req.body.customer_username || '';

    const businessEmail = String(rawBiz).trim().toLowerCase();
    const customerUsername = String(rawCust).trim().toLowerCase();

    if (!businessEmail || !customerUsername) {
      return res.status(400).json({ message: 'Missing business or customer.' });
    }

    // Look up by EMAIL (our businesses table doesn’t have a username column)
    const business = await Business.findOne({ where: { email: businessEmail } });
    if (!business) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    // Find or create the punchcard row for this (business, customer) pair
    const [card] = await Punchcard.findOrCreate({
      where: {
        businessUsername: businessEmail,   // stored in lowercase by the model setter
        customerUsername: customerUsername // stored in lowercase by the model setter
      },
      defaults: { punches: 0 }
    });

    // Increment punch and wrap to 0 on reaching the goal
    let newPunches = (card.punches || 0) + 1;
    let message;

    if (newPunches >= GOAL) {
      newPunches = 0;
      message = 'Goal reached! Punches reset to 0.';
    } else {
      message = 'Punch recorded.';
    }

    card.punches = newPunches;
    await card.save();

    return res.json({
      message,
      punches: newPunches,
      remaining: newPunches === 0 ? GOAL : (GOAL - newPunches)
    });
  } catch (err) {
    console.error('Punch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
