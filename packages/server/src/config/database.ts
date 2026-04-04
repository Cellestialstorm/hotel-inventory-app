import mongoose from 'mongoose';
import logger from '@/utils/logger';

/**
 * Handles the connection to the MongoDB database.
 * It includes logic for the initial connection, as well as handling
 * disconnections and attempting to reconnect automatically.
 */
export const connectDB = () => {
    // It's a good practice to prevent Mongoose from using a deprecated feature.
    mongoose.set('strictQuery', false);

    const mongoUrl = process.env.MONGO_URL;
    
    // A clear check to ensure the connection string is present.
    // This provides a more helpful error message if the .env file is missing or misconfigured.
    if (!mongoUrl) {
        console.error("FATAL ERROR: MONGO_URL is not defined in the environment variables.");
        process.exit(1); // Exit the application if the database URL is missing.
    }

    // Centralized connection options for clarity and easy modification.
    const options: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
    };

    logger.info('Attempting to connect to MongoDB...');

    mongoose.connect(mongoUrl, options)
      .then(() => logger.info('✅ MongoDB connection established successfully.'))
      .catch((error) => {
          logger.error(`❌ Initial MongoDB connection failed: ${error.message}`);
      });

    // --- Mongoose Connection Event Listeners ---

    // Fired when the connection is successfully re-established.
    mongoose.connection.on('reconnected', () => {
        logger.info('✅ Reconnected to MongoDB.');
    });

    // Fired when Mongoose disconnects from the database.
    mongoose.connection.on('disconnected', () => {
        logger.warn('⛔ Disconnected from MongoDB. Attempting to reconnect...');
    });

    // Fired if an error occurs on the connection.
    mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err.message);
    });
};
