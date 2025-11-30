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
const enrichmentService = require('./services/storeEnrichmentService');

require('./models/associations');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/saved-stores', savedStoreRoutes);
app.use('/api/route-starts', routeStartRoutes);

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
