import mongoose from 'mongoose';

let mongoServer;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri) {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(mongoUri);
      console.log(`MongoDB Connected successfully to: ${mongoose.connection.host}`);
    } else {
      console.log('No MONGODB_URI found in environment. Starting MongoMemoryServer for fallback...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      console.log(`MongoMemoryServer started at: ${uri}`);
      await mongoose.connect(uri);
      console.log('MongoDB Connected to local memory server.');
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('MongoMemoryServer stopped.');
    }
  } catch (error) {
    console.error(`Database disconnection error: ${error.message}`);
  }
};
