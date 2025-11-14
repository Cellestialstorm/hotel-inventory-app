import dotenv from 'dotenv';
import path from 'path';

// --- Important: Configure dotenv FIRST ---
// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// --- Imports (after dotenv config) ---
import app from './app'; // Import the configured Express app
import { connectDB } from './config/database';
// TODO: Import Winston logger instance

// --- Database Connection ---
connectDB(); // Initialize the database connection

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // TODO: Use Winston logger instead of console.log
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// --- Graceful Shutdown Handling (Optional but Recommended) ---
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  // TODO: Use Winston logger
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  // TODO: Use Winston logger
  server.close(() => {
    console.log('💥 Process terminated!');
    // Close DB connection if needed here
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT RECEIVED. Shutting down gracefully');
   // TODO: Use Winston logger
  server.close(() => {
    console.log('💥 Process terminated!');
     // Close DB connection if needed here
    process.exit(0); // Explicitly exit for SIGINT
  });
});