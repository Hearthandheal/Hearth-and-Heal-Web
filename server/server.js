import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['https://hearth-heal-org.onrender.com', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Serve frontend static files from the repository root
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, '..')));

// Redeploy for CORS fix

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hearth_heal_shop')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    console.error('Connection string:', process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET');
  });

// MongoDB event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Alias routes such as /api/register and /api/login for simpler frontend calls
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/webhooks/mpesa', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all route for frontend routing and static pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'mission.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 API ready at http://localhost:${PORT}/api`);
});
