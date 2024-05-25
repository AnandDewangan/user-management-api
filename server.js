// server.js
const express = require('express');
const cors = require('cors'); // Import cors module
const mongoose = require('mongoose');
const userRoutes = require('./routes/user');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Use cors middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect("mongodb+srv://AnandDewangan:6fajLEe9fcG21kxg@cluster0.bwp7bfv.mongodb.net/userManagement", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
