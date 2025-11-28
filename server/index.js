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
  const fs = require('fs');

  console.log('Production mode - serving static files from:', buildPath);
  console.log('Build directory exists:', fs.existsSync(buildPath));

  if (fs.existsSync(buildPath)) {
    const files = fs.readdirSync(buildPath);
    console.log('Files in build directory:', files);
  }

  app.use(express.static(buildPath));

  // Catch-all for client-side routing
  app.get('*', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    console.log('Catch-all route hit for:', req.path);
    console.log('Serving index.html from:', indexPath);
    console.log('index.html exists:', fs.existsSync(indexPath));
    res.sendFile(indexPath);
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

const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database sync completed.');

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
