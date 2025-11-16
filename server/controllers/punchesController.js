const User = require('../models/user');
const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

exports.punch = async (req, res) => {
  const { business_username, customer_username } = req.body;
  try {
    const customer = String(customer_username || '').trim().toLowerCase();
    const bizUser  = String(business_username || '').trim().toLowerCase();

    const user = await User.findOne({ where: { username: customer } });
    if (!user) return res.status(400).json({ message: 'Customer Not Found.' });

    const business = await Business.findOne({ where: { username: bizUser } });
    if (!business) return res.status(400).json({ message: 'Business Not Found.' });
    if (business.status !== 'approved') return res.status(403).json({ message: 'Business not approved yet.' });

    const goal = business.goal || 10;

    const [card] = await Punchcard.findOrCreate({
      where: { customer_username: customer, business_username: bizUser },
      defaults: { punches: 0 }
    });

    let punches = (card.punches || 0) + 1;

    if (punches >= goal) {
      punches = 0;
      await card.update({ punches });
      return res.status(200).json({ message: 'Goal reached! Card reset.', punches, goal, remaining: goal - punches });
    }

    await card.update({ punches });
    return res.status(200).json({ message: 'Punch recorded.', punches, goal, remaining: goal - punches });
  } catch (error) {
    console.error('Punchcard error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
