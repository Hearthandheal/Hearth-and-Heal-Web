require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mailer = require('./utils/mailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());

// Apply rate limiting to auth endpoints to mitigate brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// apply to auth routes
app.use('/api/auth/', authLimiter);

// Simple HTML template renderer: replaces {{key}} with provided values
function renderTemplate(templateName, vars = {}) {
  try {
    const templatePath = path.join(__dirname, 'emails', templateName);
    let html = fs.readFileSync(templatePath, 'utf8');
    Object.keys(vars).forEach((k) => {
      const re = new RegExp('{{' + k + '}}', 'g');
      html = html.replace(re, vars[k]);
    });
    return html;
  } catch (err) {
    console.error('Template render error:', err);
    return null;
  }
}


app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// MongoDB with Mongoose
const mongoose = require('mongoose');
const User = require('./models/user');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hearthandheal';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Helpers
const createToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // If frontend is on a different domain, consider 'none' + secure: true in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// If running behind a proxy (e.g., Heroku, nginx) and using secure cookies, enable trust proxy
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}


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

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    // create email verification token
    const verificationTokenRaw = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationTokenRaw).digest('hex');
    newUser.verificationToken = verificationTokenHash;
    newUser.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await newUser.save();

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationTokenRaw}`;

    const html = renderTemplate('verification.html', { url: verificationUrl, name: newUser.name || 'there' });
    const mailResult = await mailer.sendMail({
      to: newUser.email,
      subject: 'Verify your Hearth & Heal account',
      text: `Please verify your account by visiting: ${verificationUrl}`,
      html: html || undefined,
    });

    if (mailResult.previewUrl) {
      console.log('Email preview URL (Ethereal):', mailResult.previewUrl);
    }

    const token = createToken({ id: newUser._id });

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
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
    const user = await User.findOne({ email: normalizedEmail });

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

    const token = createToken({ id: user._id });
    res.cookie("token", token, cookieOptions);

    return res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// =========================
// AUTH MIDDLEWARE
// =========================
async function authenticate(req, res, next) {
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
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token / user not found." });
    }

    // expose minimal user info
    req.user = { id: user._id, name: user.name, email: user.email };
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
// EMAIL VERIFICATION
// =========================
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ verificationToken: tokenHash, verificationTokenExpires: { $gt: Date.now() } });

    if (!user) {
      // redirect back to frontend with failure
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verified?success=false`;
      return res.redirect(redirectUrl);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verified?success=true`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Verify email error:', err);
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verified?success=false`;
    return res.redirect(redirectUrl);
  }
});

// =========================
// FORGOT PASSWORD
// =========================
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(200).json({ success: true, message: 'If that account exists, a reset email has been sent.' });

    const resetRaw = crypto.randomBytes(32).toString('hex');
    const resetHash = crypto.createHash('sha256').update(resetRaw).digest('hex');
    user.resetPasswordToken = resetHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetRaw}`;
    const html = renderTemplate('reset.html', { url: resetUrl, name: user.name || 'there' });
    const mailResult = await mailer.sendMail({
      to: user.email,
      subject: 'Hearth & Heal password reset',
      text: `Reset your password by visiting: ${resetUrl}`,
      html: html || undefined,
    });

    if (mailResult.previewUrl) console.log('Password reset email preview URL:', mailResult.previewUrl);

    return res.status(200).json({ success: true, message: 'If that account exists, a reset email has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =========================
// RESET PASSWORD
// =========================
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password are required' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
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
