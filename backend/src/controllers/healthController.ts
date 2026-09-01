import { Request, Response } from 'express';

export const getHealthStatus = (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    service: 'TicketMatchPro REST API Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
