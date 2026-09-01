import { Request, Response } from 'express';
import { TicketService } from '../services/ticketService';

export const getTickets = async (req: Request, res: Response) => {
  const { city, category, search } = req.query;
  const tickets = await TicketService.getTickets({
    city: city as string,
    category: category as string,
    search: search as string,
  });
  return res.status(200).json({ success: true, data: tickets });
};

export const getTicketById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = await TicketService.getTicketById(id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'Ticket not found.' });
  }
  return res.status(200).json({ success: true, data: ticket });
};

export const createTicket = async (req: Request, res: Response) => {
  const ticket = await TicketService.createTicket(req.body);
  if (!ticket) {
    return res.status(400).json({ success: false, error: 'Failed to create ticket listing.' });
  }
  return res.status(201).json({ success: true, data: ticket });
};

export const getUserListings = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const listings = await TicketService.getUserListings(userId);
  return res.status(200).json({ success: true, data: listings });
};
