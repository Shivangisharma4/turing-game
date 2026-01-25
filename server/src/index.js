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
const startServer = async () => {
  try {
    // User requested MONGO_DB_URL specifically
    const mongoURI = process.env.MONGO_DB_URL;
    if (mongoURI) {
      await mongoose.connect(mongoURI);
      console.log('📦 Connected to MongoDB');
    } else {
      console.log('⚠️  No MongoDB URI provided, running without database');
    }

    // Only listen if not running in Vercel (Vercel handles the server)
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🎮 Server running at http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
