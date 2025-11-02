'use strict';

const Punchcard = require('../models/punchcard');

// For now goal is 10
const GOAL_RAW = Number(process.env.PUNCH_GOAL || 10);

const GOAL = Number.isFinite(GOAL_RAW) && GOAL_RAW > 0 ? Math.floor(GOAL_RAW) : 10;

// POST /api/punch          { businessUsername, customerUsername }
// or  /api/punch           { business_username, customer_username }
exports.punch = async (req, res) => {
  try {
    const businessUsername = String(
      req.body.businessUsername ?? req.body.business_username ?? ''
    ).trim().toLowerCase();

    const customerUsername = String(
      req.body.customerUsername ?? req.body.customer_username ?? ''
    ).trim().toLowerCase();

    if (!businessUsername || !customerUsername) {
      return res.status(400).json({
        message: 'businessUsername and customerUsername are required'
      });
    }

    // our Punchcard model uses snake_case fields: business_username, customer_username
    const [row] = await Punchcard.findOrCreate({
      where: {
        business_username: businessUsername,
        customer_username: customerUsername
      },
      defaults: { punches: 0 }
    });

    const current = Number(row.punches || 0);
    let newCount;
    let message;

    // Reset-to-zero logic on reaching goal
    if (current + 1 >= GOAL) {
      newCount = 0;
      message = 'Punchcard Finished.'; // reached goal; reset for next cycle
    } else {
      newCount = current + 1;
      message = 'Punch recorded.';
    }

    await row.update({ punches: newCount });

    const remainingToGoal = newCount === 0 ? GOAL : (GOAL - newCount);

    return res.status(201).json({
      message,
      businessUsername,
      customerUsername,
      punches: newCount,    // current punches after this operation (0..GOAL-1)
      goal: GOAL,           // target to earn reward
      remainingToGoal       // what to show in UI
    });
  } catch (err) {
    console.error('Punchcard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
