const User = require('../models/user');
const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

exports.punch = async (req, res) => {
    const { business_username, customer_username } = req.body;
    try {
        const user = await User.findOne({ where: { username: customer_username } });
        if (!user) {
            return res.status(400).json({ message: 'Customer Not Found.' });
        }

        const business = await Business.findOne({ where: { username: business_username } });
        if (!business) {
            return res.status(400).json({ message: 'Business Not Found.' });
        }

        const punchcard = await Punchcard.findOne({
            where: {
                customer_username: customer_username,
                business_username: business_username
            }
        });

        if (!punchcard) {
            await Punchcard.create({
                customer_username: customer_username,
                business_username: business_username,
                punches: 1
            });
            return res.status(200).json({ message: 'New Customer.', punches: 1 });
        } else {
            punchcard.punches += 1;

            if (punchcard.punches > 10) {
                punchcard.punches = 0;
                await punchcard.save();
                return res.status(200).json({ message: 'Punchcard Finished.', punches: 0 });
            } else {
                await punchcard.save();
                return res.status(200).json({ message: 'Punchcard Added.', punches: punchcard.punches });
            }
        }
    } catch (error) {
        console.error('Punchcard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
