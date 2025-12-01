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

exports.getAllAchievementsWithProgress = async (req, res) => {
    try {
        const { userId } = req.params;

        const allAchievements = await Achievement.findAll();
        const userAchievements = await UserAchievement.findAll({
            where: { userId },
            include: [{ model: Achievement, as: 'achievement' }]
        });

        const userAchievementMap = {};
        userAchievements.forEach(ua => {
            userAchievementMap[ua.achievementId] = {
                unlocked: true,
                unlockedAt: ua.unlockedAt
            };
        });

        const achievementsWithProgress = allAchievements.map(ach => ({
            id: ach.id,
            name: ach.name,
            description: ach.description,
            type: ach.type,
            condition: ach.condition,
            unlocked: !!userAchievementMap[ach.id],
            unlockedAt: userAchievementMap[ach.id]?.unlockedAt || null
        }));

        res.json({ achievements: achievementsWithProgress });
    } catch (err) {
        console.error('Error fetching achievements with progress:', err);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
};

exports.getNewlyUnlocked = async (req, res) => {
    try {
        const { userId } = req.params;

        const newlyUnlocked = await UserAchievement.findAll({
            where: {
                userId,
                firstShown: false
            },
            include: [{ model: Achievement, as: 'achievement' }]
        });

        const achievements = newlyUnlocked.map(ua => ({
            id: ua.achievement.id,
            name: ua.achievement.name,
            description: ua.achievement.description,
            type: ua.achievement.type,
            unlockedAt: ua.unlockedAt,
            userAchievementId: ua.id
        }));

        res.json({ achievements });
    } catch (err) {
        console.error('Error fetching newly unlocked achievements:', err);
        res.status(500).json({ error: 'Failed to fetch newly unlocked achievements' });
    }
};

exports.markAsShown = async (req, res) => {
    try {
        const { userId, achievementId } = req.body;

        const userAchievement = await UserAchievement.findOne({
            where: { userId, achievementId }
        });

        if (!userAchievement) {
            return res.status(404).json({ message: 'User achievement not found' });
        }

        userAchievement.firstShown = true;
        await userAchievement.save();

        res.json({ message: 'Achievement marked as shown', success: true });
    } catch (err) {
        console.error('Error marking achievement as shown:', err);
        res.status(500).json({ error: 'Failed to mark achievement as shown' });
    }
};
