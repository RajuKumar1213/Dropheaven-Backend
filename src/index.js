import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({ path: './.env' });

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚙️  Server is running on port ${process.env.PORT}`);
    });
    app.on('error', (error) => console.log('ERROR', error));
  })
  .catch((error) => {
    console.log('MONGODB CONNECTION ERROR', error);
  });
