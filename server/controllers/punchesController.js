const User = require('../models/user');
const Business = require('../models/business');
const Punchcard = require('../models/punchcard');

exports.punch = async (req, res) => {
    const {business_username, customer_username } = req.body;
    try {
        const user = await User.findOne({ where: { username:customer_username } });
        if (!user) {
            return res.status(400).json({ message: 'Customer Not Found.' });
        }

        const business = await Business.findOne({ where: { username:business_username } });
        if (!business) {
            return res.status(400).json({ message: 'Business Not Found.' });
        }
        const punch = await User.findOne({ where: { customer_username:customer_username, business_username:business_username } });
        if (!punch) {
            Punchcard.create(
            {
                customer_username:customer_username, 
                business_username:business_username,
                punches:1
            }
            )
            return res.status(200).json({ message: 'New Customer.',punches:1 });
        }
        else{
            punch.punches+=1;
            if (punches>10){
                punches = 0;
                 return res.status(200).json({ message: 'Punchcard Finished.',punches:0 });
            }
            else{
                return res.status(200).json({ message: 'Punchcard Added.',punches:punch.punches });
            }
            
        }
    } catch (error) {
        console.error('Punchcard error:', error);
        res.status(500).json({ message: 'Server error' });
    }

}
