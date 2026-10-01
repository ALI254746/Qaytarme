import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI kiritilmagan");

  if (mongoose.connection.readyState === 1) return mongoose;
  if (mongoose.connection.readyState !== 2 || !connection) {
    connection = mongoose.connect(uri);
  }

  try {
    return await connection;
  } catch (error) {
    connection = null;
    throw error;
  }
}
