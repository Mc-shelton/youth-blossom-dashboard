import { Request, Response } from 'express';
import { getAlerts } from '../services/alertsService';

export async function listAlertsController(_req: Request, res: Response) {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Failed to fetch alerts' });
  }
}
