import { Router } from 'express';
import { getExchangeRequests, createExchangeRequest } from '../controllers/exchangeController';

const router = Router();

router.get('/user/:userId', getExchangeRequests);
router.post('/', createExchangeRequest);

export default router;
