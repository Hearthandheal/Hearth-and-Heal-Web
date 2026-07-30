const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const USERS_FILE = path.join(__dirname, 'users.json');

let users = [];
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
    } else {
      users = [];
    }
  } catch (e) {
    console.error('Failed to read users file', e);
    users = [];
  }
}
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function ensureDemoUser() {
  const demoEmail = 'demo@hearth.local';
  if (!users.find(u => u.email === demoEmail)) {
    const u = {
      id: uuidv4(),
      email: demoEmail,
      name: 'Demo User',
      password: bcrypt.hashSync('password123', 10),
      twoFactor: true,
      avatar: null
    };
    users.push(u);
    saveUsers();
    console.log('Created demo user:', demoEmail, 'password: password123');
  }
}

loadUsers();

// Ensure demo user exists for development
const demoEmail = 'demo@hearth.local';
ensureDemoUser();

// If the file is empty or invalid, seed a demo user again during startup
if (!users.length) {
  ensureDemoUser();
}

// Serve static files from repo root so login.html loads at http://localhost:3000/login.html
app.use(express.static(path.join(__dirname, '..')));

// Simple in-memory OTP store: { ref: { email, code, expiresAt } }
const otps = new Map();
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function createRef() { return uuidv4(); }

// POST /request-verification - signup step 1 (dev returns code)
app.post('/request-verification', (req, res) => {
  loadUsers();
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const normalized = String(email).toLowerCase().trim();
  if (users.find(u => u.email === normalized)) return res.status(400).json({ error: 'User already exists' });
  const ref = createRef();
  const code = generateOTP();
  otps.set(ref, { type: 'signup', email: normalized, code, expiresAt: Date.now() + 10 * 60 * 1000 });
  return res.json({ ref, code });
});

// POST /verify-email - signup step 2
app.post('/verify-email', (req, res) => {
  loadUsers();
  const { ref, code, password } = req.body || {};
  if (!ref || !code || !password) return res.status(400).json({ error: 'ref, code and password required' });
  const entry = otps.get(ref);
  if (!entry || entry.type !== 'signup') return res.status(400).json({ error: 'Invalid or expired ref' });
  if (Date.now() > entry.expiresAt) { otps.delete(ref); return res.status(400).json({ error: 'Verification expired' }); }
  if (String(code) !== String(entry.code)) return res.status(400).json({ error: 'Invalid code' });
  const email = entry.email;
  if (users.find(u => u.email === email)) { otps.delete(ref); return res.status(400).json({ error: 'User already exists' }); }
  const user = { id: uuidv4(), email, name: '', password: bcrypt.hashSync(String(password), 10), twoFactor: true, avatar: null };
  users.push(user);
  saveUsers();
  otps.delete(ref);
  return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /login - password-based first step
app.post('/login', (req, res) => {
  loadUsers();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const normalized = String(email).toLowerCase().trim();
  if (normalized === demoEmail && String(password) === 'password123') {
    ensureDemoUser();
    const user = users.find(u => u.email === demoEmail);
    if (!user) return res.status(401).json({ error: 'Invalid credentials', debug: { userFound: false, passValid: false } });
    if (user.twoFactor) {
      const ref = createRef();
      const code = generateOTP();
      otps.set(ref, { email: user.email, code, expiresAt: Date.now() + 5 * 60 * 1000 });
      return res.json({ ref, message: 'OTP sent', code });
    }
  }
  const user = users.find(u => u.email === normalized);
  if (!user) return res.status(401).json({ error: 'Invalid credentials', debug: { userFound: false, passValid: false } });
  if (!bcrypt.compareSync(String(password), user.password)) {
    return res.status(401).json({ error: 'Invalid credentials', debug: { userFound: true, passValid: false } });
  }

  if (user.twoFactor) {
    const ref = createRef();
    const code = generateOTP();
    otps.set(ref, { email: user.email, code, expiresAt: Date.now() + 5 * 60 * 1000 });
    // In production send email/sms. For development return ref and code.
    return res.json({ ref, message: 'OTP sent', code });
  }

  // Direct login - issue token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

// POST /login/request - request direct OTP/login by email
app.post('/login/request', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = users.find(u => u.email === String(email).toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });
  const ref = createRef();
  const code = generateOTP();
  otps.set(ref, { email: user.email, code, expiresAt: Date.now() + 5 * 60 * 1000 });
  // Development: include code in response
  return res.json({ ref, code });
});

// POST /verify-otp - verify code and issue token
app.post('/verify-otp', (req, res) => {
  const { ref, otp, code, token } = req.body || {};
  const provided = otp || code || token;
  if (!ref || !provided) return res.status(400).json({ error: 'ref and otp/code required' });
  const entry = otps.get(ref);
  if (!entry) return res.status(400).json({ error: 'Invalid or expired ref' });
  if (Date.now() > entry.expiresAt) { otps.delete(ref); return res.status(400).json({ error: 'OTP expired' }); }
  if (String(provided) !== String(entry.code)) return res.status(400).json({ error: 'Invalid OTP' });
  // success
  otps.delete(ref);
  const user = users.find(u => u.email === entry.email);
  if (!user) return res.status(500).json({ error: 'User record missing' });
  const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({ success: true, token: jwtToken, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = users.find(u => u.id === payload.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/me
app.get('/api/me', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

// PATCH /api/me/profile
app.patch('/api/me/profile', authMiddleware, (req, res) => {
  const updates = req.body || {};
  const user = req.user;
  ['name'].forEach(k => { if (updates[k]) user[k] = updates[k]; });
  saveUsers();
  res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

// POST /api/me/avatar
const upload = multer({ dest: path.join(__dirname, 'uploads/') });
app.post('/api/me/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // For demo, store filename on user record and return URL
  const user = req.user;
  user.avatar = `/server/uploads/${req.file.filename}`;
  saveUsers();
  res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

app.listen(PORT, () => {
  console.log(`Auth server listening on http://localhost:${PORT}`);
});
