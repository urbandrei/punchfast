// Express app setup (separated from server startup for testing)
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const routeRoutes = require('./routes/routeRoutes');
const savedStoreRoutes = require('./routes/savedStoreRoutes');
const routeStartRoutes = require('./routes/routeStartRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const questionnaireRoutes = require('./routes/questionnaireRoutes');

app.use('/api', authRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/saved-stores', savedStoreRoutes);
app.use('/api/route-starts', routeStartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/questionnaire', questionnaireRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  // Catch-all for client-side routing (Express 5 compatible)
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

module.exports = app;
