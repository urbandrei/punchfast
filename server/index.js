const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");
require('dotenv').config();

const app = express();
const sequelize = require('./config/database');
require('./models/associations');

const authRoutes = require('./routes/authRoutes');
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());

app.use('/api', authRoutes);

const startServer = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Database connection error:', error);
    }
};

startServer();



