import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import ticketRoutes from './ticketRoutes';
import exchangeRoutes from './exchangeRoutes';
import llmRoutes from './llmRoutes';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tickets', ticketRoutes);
router.use('/exchanges', exchangeRoutes);
router.use('/llm', llmRoutes);

export default router;
