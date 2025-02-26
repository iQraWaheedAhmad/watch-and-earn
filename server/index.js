require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const EmployeeModel = require('./models/Employee');

const app = express();

// Determine the CLIENT_ORIGIN to use for CORS.
// In production, if process.env.CLIENT_ORIGIN is not set, default to the production URL.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "https://watch-and-earn-production.up.railway.app";

// Middleware setup
app.use(express.json());
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ["GET", "POST"],
  credentials: true
}));

// Root route to check server status
app.get("/", (req, res) => {
  res.send("Server is running and connected to MongoDB!");
});

// MongoDB connection (using your "employee" database)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://root:Itj8GT0INm80AaiQ@cluster0.oh2nc.mongodb.net/employee";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load Admin credentials from .env
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Ensure admin credentials are set
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("ERROR: Admin credentials (ADMIN_EMAIL & ADMIN_PASSWORD) are not set in .env file!");
  process.exit(1);
}

// Register endpoint to save new employee data
app.post('/register', async (req, res) => {
  try {
    console.log("🔍 Incoming Registration Data:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new EmployeeModel({
      name,
      email,
      password: hashedPassword,
    });

    await newEmployee.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    console.log("🔍 Incoming Login Data:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for Admin Login
    if (email === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        return res.status(200).json({
          message: 'Admin login successful',
          user: { email: ADMIN_EMAIL, role: 'admin' },
        });
      } else {
        return res.status(401).json({ message: 'Incorrect admin password' });
      }
    }

    // Normal user login
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No user found with that email' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Start the server on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});