import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'
import cloudinary from 'cloudinary'

import userRoutes from './routes/UserRoutes.js'
import fileRoutes from './routes/fileUploadRoutes.js'

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

const corsOptions = {
  origin: 'http://localhost:5173', // Replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Specify allowed methods
};

app.use(cors(corsOptions));

// Read environment variables
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('Environmental Variables:', { mongoUri, PORT, HOST });

if (!mongoUri) {
  console.error('MongoDB URI is undefined. Check your .env file.');
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form-encoded data
app.use('/api/users', userRoutes)
app.use('/api/files', fileRoutes)

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB Connected'))
  .catch((error) => console.error('Error connecting to MongoDB:', error.message));

// Start server
app.listen(PORT, HOST, () =>
  console.log(`Server is running on http://${HOST}:${PORT}`)
);
