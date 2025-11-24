const Achievement = require('../models/achievement');
const UserAchievement = require('../models/userachievement');

exports.getAllAchievements = async (req, res) => {
    try {
        const achievements = await Achievement.findAll();
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
};

exports.getUserAchievements = async (req, res) => {
    try {
        const achievements = await UserAchievement.findAll({
            where: { userId: req.params.userId },
            include: [{ model: Achievement, as: 'achievement' }]
        });
        res.json(achievements);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user achievements' });
    }
};

exports.awardAchievement = async (req, res) => {
    try {
        const { userId, achievementId } = req.body;

        const exists = await UserAchievement.findOne({ 
            where: { userId, achievementId }
        });

        if (exists) {
            return res.status(400).json({ message: 'Already awarded' });
        }

        const newAward = await UserAchievement.create({ userId, achievementId });

        res.json(newAward);
    } catch (err) {
        res.status(500).json({ error: 'Could not award achievement' });
    }
};
