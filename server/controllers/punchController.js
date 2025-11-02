// server/controllers/punchesController.js
const Punchcard = require('../models/punchcard');

const GOAL = Number(process.env.PUNCH_GOAL || 10);

// POST /api/punches { customerUsername, businessUsername }
exports.punch = async (req, res) => {
  try {
    let { customerUsername, businessUsername } = req.body || {};
    if (!customerUsername || !businessUsername) {
      return res.status(400).json({ message: 'customerUsername and businessUsername are required' });
    }

    customerUsername = String(customerUsername).trim().toLowerCase();
    businessUsername = String(businessUsername).trim().toLowerCase();

    const [row] = await Punchcard.findOrCreate({
      where: { customerUsername, businessUsername },
      defaults: { punches: 0 }
    });

    // increment by 1
    const updated = await row.increment('punches', { by: 1 });
    const total = updated.punches;

    const progress = total % GOAL;
    const remainingToGoal = progress === 0 ? (total === 0 ? GOAL : 0) : GOAL - progress;

    return res.status(201).json({
      message: 'Punch recorded',
      customerUsername,
      businessUsername,
      total,
      goal: GOAL,
      progress,
      remainingToGoal
    });
  } catch (e) {
    console.error('punch error', e);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/businesses/:businessUsername/punches/:customerUsername/stats
exports.stats = async (req, res) => {
  try {
    const businessUsername = String(req.params.businessUsername || '').trim().toLowerCase();
    const customerUsername = String(req.params.customerUsername || '').trim().toLowerCase();

    const row = await Punchcard.findOne({ where: { businessUsername, customerUsername } });
    const total = row ? row.punches : 0;

    const progress = total % GOAL;
    const remainingToGoal = progress === 0 ? (total === 0 ? GOAL : 0) : GOAL - progress;

    return res.json({
      customerUsername,
      businessUsername,
      total,
      goal: GOAL,
      progress,
      remainingToGoal
    });
  } catch (e) {
    console.error('stats error', e);
    return res.status(500).json({ message: 'Server error' });
  }
};
