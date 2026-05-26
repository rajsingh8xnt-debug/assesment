import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import ticketsRouter from './routes/tickets.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for frictionless testing and deployments
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome / Healthcheck API
app.get('/', (req, res) => {
  res.json({
    name: 'DeskFlow API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date()
  });
});

// Routes
app.use('/api/tickets', ticketsRouter);

// Undefined Route Handler
app.use('*', (req, res) => {
  res.status(404).json({ message: `API Endpoint ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(errorHandler);

// Connect to Database and start listening
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[DeskFlow Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
