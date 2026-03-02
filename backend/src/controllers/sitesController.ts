import { Request, Response } from 'express';
import { getSites, startImportJob } from '../services/sitesService';

export async function listSitesController(_req: Request, res: Response) {
  try {
    const sites = await getSites();
    res.json(sites);
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Failed to fetch sites' });
  }
}

export async function importSitesController(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: 'file is required' });
    const jobId = await startImportJob(file.buffer, file.originalname);
    res.status(202).json({ jobId });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Import failed' });
  }
}
