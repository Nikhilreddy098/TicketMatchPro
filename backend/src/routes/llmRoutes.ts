import { Router } from 'express';
import { chat, listModels, plan, requireLlmToken, stats } from '../controllers/llmController';

const router = Router();

router.use(requireLlmToken);
router.post('/chat', chat);
router.post('/plan', plan);
router.get('/models', listModels);
router.get('/stats', stats);

export default router;
