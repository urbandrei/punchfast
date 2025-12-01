// Load environment variables from .env file (if it exists)
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const routeRoutes = require('./routes/routeRoutes');
const savedStoreRoutes = require('./routes/savedStoreRoutes');
const routeStartRoutes = require('./routes/routeStartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const enrichmentService = require('./services/storeEnrichmentService');

require('./models/associations');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/saved-stores', savedStoreRoutes);
app.use('/api/route-starts', routeStartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  // Catch-all for client-side routing (Express 5 compatible)
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Global error handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown handler for enrichment service
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    enrichmentService.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    enrichmentService.stop();
    process.exit(0);
});

const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database sync completed.');

    // Create default admin account if it doesn't exist
    const User = require('./models/user');

    try {
      const [admin, created] = await User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          password: 'foodie123',  // Will be hashed by beforeCreate hook
          isAdmin: true,
          visits: 0,
          routes_started: 0,
          routes_completed: 0
        }
      });

      if (created) {
        console.log('✓ Default admin account created (username: admin, password: foodie123)');
      } else if (!admin.isAdmin) {
        admin.isAdmin = true;
        await admin.save();
        console.log('✓ Updated existing admin account with isAdmin flag');
      }
    } catch (error) {
      console.error('Error creating default admin account:', error);
    }

    // Start background enrichment service
    enrichmentService.start();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

startServer();
