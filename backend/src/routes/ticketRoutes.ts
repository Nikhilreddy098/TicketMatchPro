import { Router } from 'express';
import { getTickets, getTicketById, createTicket, getUserListings } from '../controllers/ticketController';

const router = Router();

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.get('/user/:userId', getUserListings);

export default router;
