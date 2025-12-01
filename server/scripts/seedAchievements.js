const sequelize = require('../config/database');
const Achievement = require('../models/achievement');

const achievementsData = [
    {
        name: 'First Visit',
        description: 'Made your first visit to a store',
        type: 'visits',
        condition: 1
    },
    {
        name: 'Regular Customer',
        description: 'Visited 10 stores',
        type: 'visits',
        condition: 10
    },
    {
        name: 'Power User',
        description: 'Visited 50 stores',
        type: 'visits',
        condition: 50
    },
    {
        name: 'Traveler',
        description: 'Started your first route',
        type: 'routes_started',
        condition: 1
    },
    {
        name: 'Route Explorer',
        description: 'Started 5 different routes',
        type: 'routes_started',
        condition: 5
    },
    {
        name: 'Route Completionist',
        description: 'Completed 5 routes',
        type: 'routes_completed',
        condition: 5
    },
    {
        name: 'Route Master',
        description: 'Completed 10 routes',
        type: 'routes_completed',
        condition: 10
    },
    {
        name: 'First Save',
        description: 'Saved your first store',
        type: 'first_save',
        condition: 1
    },
    {
        name: 'Collector',
        description: 'Saved 10 stores',
        type: 'total_saves',
        condition: 10
    }
];

async function seedAchievements() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        console.log('Seeding achievements...');

        for (const achData of achievementsData) {
            const [achievement, created] = await Achievement.findOrCreate({
                where: { name: achData.name },
                defaults: achData
            });

            if (created) {
                console.log(`✓ Created achievement: ${achData.name}`);
            } else {
                console.log(`  Achievement already exists: ${achData.name}`);
            }
        }

        console.log('\nAchievement seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding achievements:', error);
        process.exit(1);
    }
}

seedAchievements();
