import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import compression from 'compression';
import cookieParser from 'cookie-parser';
import ApiError from './utils/ApiError';

import { errorHandler } from './middleware/errorHandler.middleware';
import { generalLimiter } from './config/rateLimiters';

import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import hotelRoutes from './routes/hotel.routes';

const app = express();

// --- Core Middleware ---
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Set various HTTP headers for security
app.use(helmet());

// HTTP request logger (consider 'combined' format for production, linking with Winston later)
app.use(morgan('dev'));

// Parse incoming JSON requests
app.use(express.json({ limit: '16kb' })); // Example limit

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Parse cookies
app.use(cookieParser());

// Set Limits
app.use('/api', generalLimiter);

// // Compress responses
// app.use(compression()); // Compress responses

// --- Routes ---

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/hotels', hotelRoutes);

// --- Error Handling Middleware ---
app.use((_req, _res, next) => {
  next(new ApiError(404, 'Not Found'));
});

app.use(errorHandler);


export default app;