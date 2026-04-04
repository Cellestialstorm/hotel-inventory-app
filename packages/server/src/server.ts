import dotenv from 'dotenv';
import path from 'path';

// --- Important: Configure dotenv FIRST ---
// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// --- Imports (after dotenv config) ---
import app from './app'; // Import the configured Express app
import { connectDB } from './config/database';
import logger from './utils/logger';

// --- Database Connection ---
connectDB(); // Initialize the database connection

// --- Server Startup ---
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  // TODO: Use Winston logger instead of console.log
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// --- Graceful Shutdown Handling (Optional but Recommended) ---
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  
  server.close(() => {
    logger.info('💥 Process terminated!');
    
  });
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');
  
  server.close(() => {
    logger.info('💥 Process terminated!');
    process.exit(0);
  });
});