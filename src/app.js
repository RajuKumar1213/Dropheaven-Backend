import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

dotenv.config();

// cors
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// import routers

import professionalRouter from './routes/professional.routes.js';
import customerRouter from './routes/customer.routes.js';
import companyRouter from './routes/company.routes.js';
import serviceRouter from './routes/service.routes.js';
import taskRouter from './routes/task.routes.js';

app.use('/api/v1/professional', professionalRouter);
app.use('/api/v1/customer', customerRouter);
app.use('/api/v1/company', companyRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/task', taskRouter);

export { app };
