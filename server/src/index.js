import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import gameRoutes from './routes/gameRoutes.js';
import npcRoutes from './routes/npcRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for initial deployment complexity reduction
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/game', gameRoutes);
app.use('/api/npc', npcRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'The Turing Mystery server is running' });
});

// Connect to MongoDB and start server
// Connect to MongoDB
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('📦 Connected to MongoDB');
    } else {
      console.log('⚠️  No MongoDB URI provided, running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Start server if not running in Vercel (Vercel handles the port integration)
if (!process.env.VERCEL) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`🎮 Server running at http://localhost:${PORT}`);
  });
} else {
  // In Vercel, just connect DB
  connectDB();
}

export default app;
