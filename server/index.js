require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { sequelize } = require("./models");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "*",
        credentials: true,
    })
);

// Load routes
app.use("/api", require("./routes/api"));

// Start server
sequelize.sync().then(() => {
    console.log(" Database synced");

    app.listen(5000, () => {
        console.log(" Backend running on port 5000");
    });
});
