import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dataDir = path.join(root, 'src', 'data');
const docxPath = path.join(dataDir, 'targeted IDP sites_Gubadley district.docx');
const xlsxPath = path.join(dataDir, 'IOM_DTM_ETT_SOM_Tracker_sinceFeb2025_w49.xlsx');

// ---------- helpers ----------
function loadSharedStrings() {
  const { stdout } = spawnSync('unzip', ['-p', xlsxPath, 'xl/sharedStrings.xml'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 120,
  });
  if (!stdout) throw new Error('Cannot read sharedStrings.xml');
  return [...stdout.matchAll(/<si><t[^>]*>([\s\S]*?)<\/t><\/si>/g)].map((m) => m[1]);
}

function parseDocxSites() {
  const { stdout } = spawnSync('unzip', ['-p', docxPath, 'word/document.xml'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50,
  });
  if (!stdout) throw new Error('Cannot read docx');
  const tokens = [...stdout.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
  const start = tokens.findIndex((t) => t.toLowerCase() === 'longatitute') + 1;
  const sites = [];
  for (let i = start; i + 4 < tokens.length; ) {
    const nameParts = [];
    while (i < tokens.length && tokens[i].toLowerCase() !== 'site') {
      nameParts.push(tokens[i]);
      i++;
    }
    if (i >= tokens.length) break;
    i++; // skip 'Site'
    const households = parseInt(tokens[i]); i++;
    if (tokens[i] && tokens[i].toLowerCase() === 'hhs') i++;
    const lat = parseFloat(String(tokens[i]).replace(/[^0-9.-]/g, '')); i++;
    const lon = parseFloat(String(tokens[i]).replace(/[^0-9.-]/g, '')); i++;
    const name = nameParts.join(' ').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    sites.push({ name, households, lat, lon });
  }
  return sites;
}

// ---------- main extraction ----------
async function extractArrivals(siteNames, shared) {
  const namesSet = new Set(siteNames.map((s) => s.toLowerCase()));
  const totals = new Map();

  const proc = spawn('unzip', ['-p', xlsxPath, 'xl/worksheets/sheet1.xml']);
  let buffer = '';
  let rowCount = 0;

  function decodeCell(inner, type) {
    if (type === 's' || type === undefined) {
      const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
      const idx = vMatch ? parseInt(vMatch[1], 10) : NaN;
      if (!Number.isNaN(idx) && shared[idx] !== undefined) return shared[idx];
    }
    const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);
    return vMatch ? vMatch[1] : '';
  }

  return new Promise((resolve, reject) => {
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let idx;
      while ((idx = buffer.indexOf('</row>')) !== -1) {
        const rowXml = buffer.slice(0, idx + 6);
        buffer = buffer.slice(idx + 6);
        const rowNumMatch = rowXml.match(/r="(\d+)"/);
        if (!rowNumMatch) continue;
        const rowNum = parseInt(rowNumMatch[1], 10);
        if (rowNum === 1) continue; // header
        rowCount++;
        const cellRegex = /<c[^>]*r="([A-Z]+)\d+"[^>]*?(?:t="(\w)")?[^>]*>([\s\S]*?)<\/c>/g;
        let m;
        let settlement = '';
        let arrivals = 0;
        while ((m = cellRegex.exec(rowXml)) !== null) {
          const [, col, type, inner] = m;
          if (col === 'H') settlement = decodeCell(inner, type).trim();
          if (col === 'P') {
            const val = decodeCell(inner, type).trim();
            arrivals = Number(val || 0);
          }
        }
        if (!settlement) continue;
        if (namesSet.has(settlement.toLowerCase())) {
          const cur = totals.get(settlement) || 0;
          totals.set(settlement, cur + arrivals);
        }
      }
    });
    proc.on('error', reject);
    proc.on('close', () => {
      resolve({ totals, rowCount });
    });
  });
}

async function main() {
  const shared = loadSharedStrings();
  const sites = parseDocxSites();
  const { totals } = await extractArrivals(sites.map((s) => s.name), shared);

  const districtRotation = ['Dayniile', 'Hodan', 'Kahda'];
  const merged = sites.map((s, idx) => {
    const arrivals = totals.get(s.name) ?? Math.round(s.households * 0.12);
    return {
      ...s,
      district: districtRotation[idx % districtRotation.length],
      newArrivals14d: arrivals,
    };
  });

  const displacement = Array.from(totals.entries()).map(([site, arrivals], idx) => ({
    id: `ETT-${idx + 1}`,
    site,
    district: districtRotation[idx % districtRotation.length],
    arrivals,
    reportedAt: new Date().toISOString(),
  }));

  const outPath = path.join(dataDir, 'nabad.generated.ts');
  fs.writeFileSync(
    outPath,
    `// Auto-generated from IOM ETT + Gubadley docx. Do not edit by hand.\n` +
      `export const generatedSites = ${JSON.stringify(merged, null, 2)} as const;\n` +
      `export const generatedDisplacement = ${JSON.stringify(displacement, null, 2)} as const;\n`
  );
  console.log('Generated sites', merged.length, 'with arrivals from matches', totals.size);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
