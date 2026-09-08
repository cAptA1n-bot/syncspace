const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./database/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes)

module.exports = app;