'use strict';

const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

const GOAL = parseInt(process.env.PUNCH_GOAL || '10', 10);

/**
 * POST /api/punch
 * Body:
 *   - customer_username: string   (required)
 *   - business_username: string   (business email; BusinessHome sends this)
 *   - businessEmail: string       (legacy alias; also accepted)
 */
exports.punch = async (req, res) => {
  console.log('[punchesController] v-email-only');
  try {
    const rawCust = req.body?.customer_username || '';
    const rawBiz  = req.body?.business_username || req.body?.businessEmail || '';

    const customerUsername = String(rawCust).trim().toLowerCase();
    const businessEmail    = String(rawBiz).trim().toLowerCase();

    if (!customerUsername || !businessEmail) {
      return res.status(400).json({ message: 'Missing customer or business.' });
    }

    // Look up business by EMAIL only
    const business = await Business.findOne({ where: { email: businessEmail } });
    if (!business) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    // Use the email as the  business key on the punchcard
    const [card] = await Punchcard.findOrCreate({
      where: {
        businessUsername: businessEmail,   // model setter will lower-case
        customerUsername: customerUsername // model setter will lower-case
      },
      defaults: { punches: 0 }
    });

    let newPunches = (card.punches || 0) + 1;
    let message;

    if (newPunches >= GOAL) {
      newPunches = 0; // reset on reward
      message = 'Goal reached! Punches reset to 0.';
    } else {
      message = 'Punch recorded.';
    }

    card.punches = newPunches;
    await card.save();

    return res.json({
      message,
      punches: newPunches,
      remaining: newPunches === 0 ? GOAL : (GOAL - newPunches),
      goal: GOAL
    });
  } catch (err) {
    console.error('Punch error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
