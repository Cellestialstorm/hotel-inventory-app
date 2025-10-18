import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// --- Important ---
// 1. Configure dotenv with the correct path to the root .env file.
//    This line MUST come before any other local imports that need environment variables.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// 2. Now, import your database module.
import { connectDB } from './config/database';

// 3. Initialize the database connection.
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- Routes ---
// A simple health check route to confirm the server is running.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy and running' });
});

// TODO: Add your application-specific routes here
// Example: app.use('/api/inventory', inventoryRoutes);

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

