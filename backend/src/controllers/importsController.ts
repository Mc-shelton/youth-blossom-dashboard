import { Request, Response } from 'express';
import { listImportJobs } from '../repositories/importsRepository';

export async function listImportsController(_req: Request, res: Response) {
  try {
    const jobs = await listImportJobs(30);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Failed to fetch import jobs' });
  }
}
