import mongoose from 'mongoose';

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

    /**
     * A function to encapsulate the connection logic, allowing it to be reused
     * for initial connection and for retries upon disconnection.
     */
    const attemptConnection = () => {
      mongoose.connect(mongoUrl, options)
        .then(() => console.log('✅ MongoDB connection established successfully.'))
        .catch((error) => {
            // Log the error without exiting, as the 'disconnected' handler will manage retries.
            console.error('❌ MongoDB connection failed. Retrying in 5 seconds...', error.message);
        });
    }

    // --- Mongoose Connection Event Listeners ---

    // Fired when the connection is successfully re-established.
    mongoose.connection.on('reconnected', () => {
        console.log('✅ Reconnected to MongoDB.');
    });

    // Fired when Mongoose disconnects from the database.
    mongoose.connection.on('disconnected', () => {
        console.log('⛔ Disconnected from MongoDB. Attempting to reconnect...');
        // Wait 5 seconds before attempting to reconnect to avoid spamming the server.
        setTimeout(attemptConnection, 5000);
    });

    // Fired if an error occurs on the connection.
    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });

    // Initiate the first connection attempt.
    console.log('Attempting to connect to MongoDB...');
    attemptConnection();
};
