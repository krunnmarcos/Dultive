import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const mongoUri = process.env.MONGO_URI;
const mongoDbName = process.env.MONGO_DB_NAME || 'dultive';

if (!mongoUri) {
  throw new Error('MONGO_URI não está definido. Configure a variável de ambiente no arquivo .env');
}

mongoose.set('strictQuery', true);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(mongoUri, { dbName: mongoDbName })
  .then(() => console.log(`MongoDB connected (db: ${mongoDbName})`))
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Dultive API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
