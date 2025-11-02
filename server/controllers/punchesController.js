const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

const GOAL = 10; // keep in sync with frontend

exports.punch = async (req, res) => {
  try {
    const customer_username = (req.body.customer_username || '').trim();
    // Accept either business_username or businessEmail from the client
    const businessIdentifier =
      (req.body.business_username || req.body.businessEmail || '').trim().toLowerCase();

    if (!customer_username) {
      return res.status(400).json({ message: 'Customer username is required.' });
    }
    if (!businessIdentifier) {
      return res.status(400).json({ message: 'Business identifier is required.' });
    }

    // Our Business table uses email, not username
    const business = await Business.findOne({ where: { email: businessIdentifier } });
    if (!business) {
      return res.status(400).json({ message: 'Business Not Found.' });
    }

    // Create or find the punchcard record for (customer, business)
    const [card, created] = await Punchcard.findOrCreate({
      where: {
        customer_username,
        business_username: business.email, // normalize to email
      },
      defaults: { punches: 0 },
    });

    // Increment and reset to 0 after reaching GOAL
    card.punches += 1;
    let message = 'Punchcard Added.';
    if (card.punches >= GOAL) {
      card.punches = 0;
      message = 'Punchcard Finished.';
    }
    await card.save();

    const remaining = (GOAL - card.punches) % GOAL;

    return res.status(200).json({
      message: created ? 'New Customer.' : message,
      punches: card.punches,
      remaining,
    });
  } catch (err) {
    console.error('Punchcard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
