const express = require('express');
const app = express();
const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', authRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      await sequelize.sync(); 
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();