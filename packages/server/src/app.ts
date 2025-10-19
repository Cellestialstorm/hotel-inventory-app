import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // Import helmet
import morgan from 'morgan'; // Import morgan
// import compression from 'compression'; // Import compression
import ApiError from './utils/ApiError';
// import { errorHandler } from './middleware/errorHandler.middleware';
// import ApiResponse from './utils/ApiResponse';

// TODO: Import error handling middleware
// TODO: Import your application routes

const app = express();

// --- Core Middleware ---

// Configure CORS - *Replace '*' with your frontend URL in production*
// Example: cors({ origin: 'http://localhost:3000', credentials: true })
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

// Set various HTTP headers for security
app.use(helmet());

// HTTP request logger (consider 'combined' format for production, linking with Winston later)
app.use(morgan('dev'));

// Parse incoming JSON requests
app.use(express.json({ limit: '16kb' })); // Example limit

// Parse URL-encoded requests (optional, if using forms)
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// // Compress responses
// app.use(compression()); // Compress responses

// --- Routes ---

// Simple health check route (can be moved to a dedicated router later)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// TODO: Mount your application-specific routers here
// Example:
// import inventoryRoutes from './routes/inventory.routes';
// app.use('/api/inventory', inventoryRoutes);

// --- Error Handling Middleware ---
// TODO: Add 404 handler for unmatched routes
app.use((_req, _res, next) => {
  next(new ApiError(404, 'Not Found'));
});

// app.use(errorHandler);


export default app; // Export the configured app instance