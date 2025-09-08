import mongoose from 'mongoose';

export async function connectDB(uri) {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, { 
      dbName: 'recruiter_assistant',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});