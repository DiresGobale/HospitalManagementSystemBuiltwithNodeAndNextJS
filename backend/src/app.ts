import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { clinicRouter } from './routes/clinic.routes.js';
import { doctorRouter } from './routes/doctor.routes.js';
import { serviceRouter } from './routes/service.routes.js';
import { patientRouter } from './routes/patient.routes.js';
import { appointmentRouter } from './routes/appointment.routes.js';
import { queueRouter } from './routes/queue.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { diagnosticRouter } from './routes/diagnostic.routes.js';
import { pharmacyRouter } from './routes/pharmacy.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-clinic-id', 'idempotency-key'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' } },
  });
  app.use('/api/v1/auth', authLimiter);

  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/ready', (req: Request, res: Response) => {
    res.json({ status: 'ready', uptime: process.uptime() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/clinics', clinicRouter);
  app.use('/api/v1/doctors', doctorRouter);
  app.use('/api/v1/services', serviceRouter);
  app.use('/api/v1/patients', patientRouter);
  app.use('/api/v1/appointments', appointmentRouter);
  app.use('/api/v1/queue', queueRouter);
  app.use('/api/v1/reports', reportsRouter);
  app.use('/api/v1/diagnostics', diagnosticRouter);
  app.use('/api/v1/pharmacy', pharmacyRouter);

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` },
    });
  });

  app.use(errorHandler);

  return app;
}

