const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./database/db');
const cookieParser = require('cookie-parser');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes)

module.exports = app;