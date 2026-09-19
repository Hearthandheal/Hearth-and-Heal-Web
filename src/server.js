require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Temporary in-memory users.
// Replace this with your database once the login flow is confirmed working.
const users = [];

// Helpers
const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// =========================
// REGISTER
// =========================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      id: Date.now().toString(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
    };

    users.push(user);

    const token = createToken({ id: user.id });

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =========================
// LOGIN
// =========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = createToken({ id: user.id });
    res.cookie("token", token, cookieOptions);

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =========================
// AUTH MIDDLEWARE
// =========================
function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization &&
        req.headers.authorization.split(" ")[0] === "Bearer" &&
        req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = users.find((u) => u.id === decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token / user not found." });
    }

    // expose minimal user info
    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
}

// =========================
// PROTECTED: GET CURRENT USER
// =========================
app.get("/api/auth/me", authenticate, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// =========================
// LOGOUT
// =========================
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.json({ success: true, message: "Logged out." });
});

// =========================
// Example protected route
// =========================
app.get("/api/protected", authenticate, (req, res) => {
  res.json({ success: true, data: `Hello ${req.user.name}, protected data.` });
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`)
);
