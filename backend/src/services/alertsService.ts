import { listAlerts, seedAlerts } from '../repositories/alertsRepository';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type CommunityAlert = {
  id: string;
  site: string;
  district: string;
  channel: string;
  category: string;
  severity: string;
  message: string;
  reportedAt: string;
};

function loadCommunityAlerts(): CommunityAlert[] {
  // Load from frontend data file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const frontendData = path.resolve(__dirname, "../../src/data/nabad.generated.ts");
  const fallback = path.resolve(__dirname, "../../src/data/nabad.ts");
  const target = fs.existsSync(frontendData) ? frontendData : (fs.existsSync(fallback) ? fallback : null);
  if (!target) return [];
  const text = fs.readFileSync(target, "utf-8");
  const match = text.match(/export const communityAlerts[^=]*=\\s*(\\[[\\s\\S]*?\\]);/m);
  if (!match) return [];
  const jsonish = match[1]
    .replace(/([a-zA-Z0-9_]+):/g, '"$1":')
    .replace(/\\'(.*?)\\'/g, '"$1"');
  try {
    return JSON.parse(jsonish) as CommunityAlert[];
  } catch {
    return [];
  }
}

export async function getAlerts() {
  return listAlerts();
}

export async function ensureSeedAlerts() {
  const seed = loadCommunityAlerts().map((a) => ({
    id: a.id,
    siteName: a.site,
    district: a.district,
    channel: a.channel,
    category: a.category,
    severity: a.severity,
    message: a.message,
    reportedAt: new Date(a.reportedAt),
  }));
  await seedAlerts(seed);
}
