const { User, Store, FieldQuestion } = require('../models/associations');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Achievement = require('../models/achievement');
const UserAchievement = require('../models/userachievement');

/**
 * GET /api/questionnaire/pending?userId=X&visitId=Y
 * Check if there's a pending questionnaire for this visit
 * Returns question data if triggered, null if not
 */
exports.checkPendingQuestionnaire = async (req, res) => {
    try {
        const { userId, visitId } = req.query;

        if (!userId || !visitId) {
            return res.status(400).json({ message: 'Missing userId or visitId' });
        }

        // Get visit details (includes storeId and shouldShowQuestionnaire flag)
        const Visit = require('../models/visit');
        const visit = await Visit.findByPk(visitId);

        if (!visit) {
            return res.status(404).json({ message: 'Visit not found' });
        }

        // Check if questionnaire was triggered for this visit
        if (!visit.shouldShowQuestionnaire) {
            return res.json({ hasQuestion: false });
        }

        // Get store details
        const store = await Store.findByPk(visit.storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Find an unanswered field question
        const question = await generateFieldQuestion(userId, visit.storeId, store);

        if (!question) {
            return res.json({ hasQuestion: false });
        }

        return res.json({
            hasQuestion: true,
            visitId,
            storeId: visit.storeId,
            storeName: store.name,
            question
        });

    } catch (error) {
        console.error('Error checking pending questionnaire:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/questionnaire/question?userId=X&storeId=Y
 * Generate a field question for a user+store combination
 */
exports.getQuestion = async (req, res) => {
    try {
        const { userId, storeId } = req.query;

        if (!userId || !storeId) {
            return res.status(400).json({ message: 'Missing userId or storeId' });
        }

        const store = await Store.findByPk(storeId);
        if (!store) {
            return res.status(404).json({ message: 'Store not found' });
        }

        const question = await generateFieldQuestion(userId, storeId, store);

        if (!question) {
            return res.json({ hasQuestion: false });
        }

        return res.json({
            hasQuestion: true,
            storeId,
            storeName: store.name,
            question
        });

    } catch (error) {
        console.error('Error generating question:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/questionnaire/answer
 * Submit answer to a field question
 * Body: { userId, storeId, fieldName, suggestedValue, skipped }
 */
exports.submitAnswer = async (req, res) => {
    try {
        const { userId, storeId, fieldName, suggestedValue, skipped } = req.body;

        if (!userId || !storeId || !fieldName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create the field question response
        const response = await FieldQuestion.create({
            userId,
            storeId,
            fieldName,
            suggestedValue: skipped ? null : suggestedValue,
            skipped: !!skipped
        });

        // Update user counter (only if not skipped)
        if (!skipped) {
            const user = await User.findByPk(userId);
            user.questions_answered += 1;
            await user.save();

            // Check for achievements
            const unlockedAchievements = await checkQuestionAchievements(user);

            // If this was a rating question, update store rating
            if (fieldName === 'rating' && suggestedValue) {
                await updateStoreRating(storeId);
            }

            return res.json({
                message: 'Answer submitted',
                response,
                unlockedAchievements
            });
        }

        return res.json({
            message: 'Question skipped',
            response
        });

    } catch (error) {
        console.error('Error submitting answer:', error);

        // Handle unique constraint violation (already answered this question)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Question already answered for this store' });
        }

        return res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Helper: Generate a field question for a user+store
 */
async function generateFieldQuestion(userId, storeId, store) {
    // Get already answered field questions for this user+store
    const answeredQuestions = await FieldQuestion.findAll({
        where: { userId, storeId },
        attributes: ['fieldName']
    });

    const answeredFields = answeredQuestions.map(q => q.fieldName);

    // Priority order: rating, then field validation questions
    const candidateFields = ['rating', 'cuisine', 'amenity', 'shop'];

    // Filter out already answered fields
    const unansweredFields = candidateFields.filter(f => !answeredFields.includes(f));

    if (unansweredFields.length === 0) {
        return null; // No more questions for this store
    }

    // Pick the first unanswered field (priority order)
    const fieldName = unansweredFields[0];

    if (fieldName === 'rating') {
        return {
            type: 'rating',
            fieldName: 'rating',
            questionText: `How would you rate ${store.name}?`,
            options: [
                { label: '1 Star', value: '1' },
                { label: '3 Stars', value: '3' },
                { label: '5 Stars', value: '5' }
            ]
        };
    }

    // Field validation question
    const currentValue = store[fieldName];
    const options = await getFieldOptions(fieldName, currentValue, storeId);

    if (options.length === 0) {
        return null; // Can't generate question without options
    }

    return {
        type: 'field_validation',
        fieldName,
        questionText: getFieldQuestionText(fieldName, store.name),
        currentValue,
        options
    };
}

/**
 * Helper: Get 3 options for a field question
 */
async function getFieldOptions(fieldName, currentValue, excludeStoreId) {
    const options = [];

    // If field has a current value, include it as first option
    if (currentValue) {
        options.push({ label: currentValue, value: currentValue });
    }

    // Query database for other common values (exclude current value and null)
    const neededCount = 3 - options.length;

    if (neededCount > 0) {
        // Get distinct values ordered by frequency
        const results = await sequelize.query(
            `SELECT "${fieldName}", COUNT(*) as count
             FROM "Stores"
             WHERE "${fieldName}" IS NOT NULL
               AND "${fieldName}" != ''
               AND "${fieldName}" != :currentValue
             GROUP BY "${fieldName}"
             ORDER BY count DESC
             LIMIT :limit`,
            {
                replacements: {
                    currentValue: currentValue || '',
                    limit: neededCount
                },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Add these as options
        results.forEach(row => {
            options.push({
                label: row[fieldName],
                value: row[fieldName]
            });
        });
    }

    // Shuffle options to randomize order
    return shuffleArray(options).slice(0, 3);
}

/**
 * Helper: Get question text for a field
 */
function getFieldQuestionText(fieldName, storeName) {
    const questions = {
        cuisine: `What type of cuisine does ${storeName} serve?`,
        amenity: `What type of amenity is ${storeName}?`,
        shop: `What type of shop is ${storeName}?`
    };
    return questions[fieldName] || `What is the ${fieldName} for ${storeName}?`;
}

/**
 * Helper: Update store rating based on all rating responses
 */
async function updateStoreRating(storeId) {
    // Calculate average of all non-skipped ratings
    const result = await FieldQuestion.findOne({
        where: {
            storeId,
            fieldName: 'rating',
            skipped: false,
            suggestedValue: { [Op.ne]: null }
        },
        attributes: [
            [sequelize.fn('AVG', sequelize.cast(sequelize.col('suggestedValue'), 'FLOAT')), 'avgRating']
        ],
        raw: true
    });

    const avgRating = result?.avgRating ? parseFloat(result.avgRating) : null;

    // Update store
    await Store.update(
        { rating: avgRating },
        { where: { id: storeId } }
    );
}

/**
 * Helper: Check for question-related achievements
 */
async function checkQuestionAchievements(user) {
    const unlockedAchievements = [];
    const achievements = await Achievement.findAll({
        where: { type: 'questions_answered' }
    });

    for (let ach of achievements) {
        const alreadyUnlocked = await UserAchievement.findOne({
            where: { userId: user.id, achievementId: ach.id }
        });

        if (!alreadyUnlocked && user.questions_answered >= ach.condition) {
            await UserAchievement.create({
                userId: user.id,
                achievementId: ach.id
            });
            unlockedAchievements.push(ach);
        }
    }

    return unlockedAchievements;
}

/**
 * Helper: Shuffle array (Fisher-Yates)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = exports;
