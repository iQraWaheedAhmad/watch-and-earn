require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const EmployeeModel = require('./models/Employee');

const app = express();

// Middleware setup
app.use(express.json());

// CORS setup (restrict to frontend URL)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
}));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/employees", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Admin credentials (Hardcoded)
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "Imranhelo123@";

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: '❌ All fields are required' });
    }

    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '❌ Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new EmployeeModel({
      name,
      email,
      password: hashedPassword,
    });

    await newEmployee.save();
    res.status(201).json({ message: '✅ Registration successful' });
  } catch (err) {
    console.error('❌ Error during registration:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '❌ Email and password are required' });
    }

    // Check for Admin Login
    if (email === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        return res.status(200).json({
          message: '✅ Admin login successful',
          user: { email: ADMIN_EMAIL, role: 'admin' },
        });
      } else {
        return res.status(401).json({ message: '❌ Incorrect admin password' });
      }
    }

    // Normal user login
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '❌ No user found with that email' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: '❌ Incorrect password' });
    }

    res.status(200).json({ message: '✅ Login successful', user });
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
