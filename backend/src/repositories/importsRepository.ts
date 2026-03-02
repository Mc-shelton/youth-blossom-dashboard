import { prisma } from '../services/db';
import { ImportJob } from '@prisma/client';
import crypto from 'crypto';

export async function createImportJob(filename: string, tempPath?: string, savedTemp = false): Promise<ImportJob> {
  return prisma.importJob.create({
    data: { id: crypto.randomUUID(), filename, status: 'pending', tempPath, savedTemp },
  });
}

export async function markImportJob(id: string, status: 'done' | 'failed', message?: string) {
  return prisma.importJob.update({
    where: { id },
    data: { status, message, finishedAt: new Date() },
  });
}

export async function markTempSaved(id: string, tempPath: string) {
  return prisma.importJob.update({
    where: { id },
    data: { tempPath, savedTemp: true },
  });
}

export async function listImportJobs(limit = 20): Promise<ImportJob[]> {
  return prisma.importJob.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}

export async function listPendingImports(): Promise<ImportJob[]> {
  return prisma.importJob.findMany({ where: { status: 'pending', tempPath: { not: null } }, orderBy: { createdAt: 'asc' } });
}
