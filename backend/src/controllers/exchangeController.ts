import { Request, Response } from 'express';
import { ExchangeService } from '../services/exchangeService';

export const getExchangeRequests = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const requests = await ExchangeService.getExchangeRequests(userId);
  return res.status(200).json({ success: true, data: requests });
};

export const createExchangeRequest = async (req: Request, res: Response) => {
  const exchange = await ExchangeService.createExchangeRequest(req.body);
  if (!exchange) {
    return res.status(400).json({ success: false, error: 'Failed to create exchange request.' });
  }
  return res.status(201).json({ success: true, data: exchange });
};
