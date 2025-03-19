require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const Stripe = require("stripe");
const EmployeeModel = require("./models/Employee");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY ? "✅ Loaded" : "❌ Not Found");  // Debugging

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_ORIGIN || "http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true,
}));

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running and connected to MongoDB!");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Admin Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ✅ Stripe Checkout Route
app.post("/stripe-checkout", async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { amount, plan } = req.body;
    if (!amount || !plan) {
      return res.status(400).json({ error: "Amount and plan details are required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Plan: ₨${plan.price.toLocaleString()}`,
              description: `Daily Profit: ₨${plan.profit}`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_ORIGIN}/cancel`,
    });

    console.log("✅ Stripe Session Created:", session);

    if (!session.url) {
      console.error("❌ Stripe session URL missing!", session);
      return res.status(500).json({ error: "Stripe session URL is missing" });
    }

    res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("❌ Stripe Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ Register Route
app.post("/register", async (req, res) => {
  try {
    console.log("🔍 Incoming Registration Data:", req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = new EmployeeModel({ name, email, password: hashedPassword });

    await newEmployee.save();
    res.status(201).json({ message: "✅ Registration successful" });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  try {
    console.log("🔍 Incoming Login Data:", req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (email === ADMIN_EMAIL) {
      if (password === ADMIN_PASSWORD) {
        return res.status(200).json({
          message: "✅ Admin login successful",
          user: { email: ADMIN_EMAIL, role: "admin" },
        });
      } else {
        return res.status(401).json({ message: "❌ Incorrect admin password" });
      }
    }

    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "❌ No user found with that email" });
    }

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

// ✅ Start the Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
