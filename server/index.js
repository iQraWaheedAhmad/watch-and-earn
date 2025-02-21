const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const EmployeeModel = require("./models/Employee"); // Import the Employee model
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({ origin: "*" }));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/employee")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

 const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "❌ Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new EmployeeModel({
      name,
      email,
      password: hashedPassword,
    });

    await newEmployee.save();
    res.status(201).json({ message: "✅ Registration successful", employee: newEmployee });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user is admin
    if (email === "admin@gmail.com") {
      if (password === "Imranhelo123@") {
        return res.status(200).json({
          message: "✅ Admin login successful",
          user: { email: "admin@gmail.com", role: "admin" },
        });
      } else {
        return res.status(401).json({ message: "❌ Incorrect admin password" });
      }
    }

    // Find normal user
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "❌ No user found with that email" });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "❌ Incorrect password" });
    }

    res.status(200).json({ message: "✅ Login successful", user });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
