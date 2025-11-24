const express = require('express');
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

const startServer = async () => {
  try {
    await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      await sequelize.sync({ alter: true });
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
