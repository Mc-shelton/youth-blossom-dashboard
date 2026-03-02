import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dataDir = path.join(root, 'src', 'data');
const csvPath = path.join(dataDir, 'full dataset by assessment.csv');

// Base Gubadley sites (from the provided DOCX, manually cleaned)
const baseSites = [
  { name: 'Ceel Siyaad', households: 776, lat: 2.083695, lon: 45.401881 },
  { name: 'Dan Hiil', households: 852, lat: 2.083938, lon: 45.401829 },
  { name: 'Banaaneey', households: 511, lat: 2.083892, lon: 45.402141 },
  { name: 'Deeb Cadde', households: 568, lat: 2.084492, lon: 45.404458 },
  { name: 'Ceel Shuute', households: 714, lat: 2.086258, lon: 45.404271 },
  { name: 'dan guud', households: 812, lat: 2.086629, lon: 45.404079 },
  { name: 'Callud', households: 707, lat: 2.087126, lon: 45.404302 },
  { name: 'Dan Yar', households: 674, lat: 2.087445, lon: 45.404404 },
  { name: 'Daacad', households: 845, lat: 2.087445, lon: 45.404936 },
  { name: 'Il Feyd', households: 797, lat: 2.087789, lon: 45.404602 },
  { name: 'Bil Cil', households: 515, lat: 2.088137, lon: 45.404846 },
  { name: 'Aadan Yabaal', households: 623, lat: 2.088426, lon: 45.404952 },
  { name: 'Boos Hareri', households: 617, lat: 2.088222, lon: 45.417781 },
  { name: 'Godgale', households: 698, lat: 2.087907, lon: 45.417814 },
  { name: 'Ceel Muluq', households: 734, lat: 2.088301, lon: 45.418112 },
  { name: 'Dhogonle', households: 581, lat: 2.08828, lon: 45.41846 },
  { name: 'Gunray', households: 447, lat: 2.08831, lon: 45.419184 },
  { name: 'Alkowthar', households: 587, lat: 2.087953, lon: 45.416966 },
  { name: 'Nasteex', households: 590, lat: 2.084317, lon: 45.401763 },
  { name: 'Wadani', households: 256, lat: 2.084339, lon: 45.401561 },
  { name: 'Iftin', households: 166, lat: 2.084441, lon: 45.401852 },
  { name: 'Caloola cad', households: 522, lat: 2.087046, lon: 45.404635 },
  { name: 'Alfardows', households: 110, lat: 2.079418, lon: 45.411491 },
  { name: 'Galharuur', households: 412, lat: 2.088112, lon: 45.417337 },
  { name: 'Burcade', households: 577, lat: 2.083391, lon: 45.393872 },
];

// Simple CSV parser with quote support
function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch === '\r') {
        // ignore
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Lightweight Levenshtein for short strings
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

function buildDisplacement(siteNames) {
  const rows = parseCSV(csvPath);
  const header = rows[0];
  const col = (name) => header.findIndex((h) => h.trim() === name);
  const idxRegion = col('Region Name');
  const idxDistrict = col('District Name');
  const idxSettlement = col('Settlement Name');
  const idxArrivals = col('New arrivals since last week') !== -1 ? col('New arrivals since last week') : col('Total new arrivals since last week');
  const idxDate = col('Date of Assessment');
  if ([idxRegion, idxDistrict, idxSettlement, idxArrivals].some((i) => i === -1)) {
    throw new Error('Required columns missing in CSV header');
  }

  const targetDistricts = new Set(['Dayniile', 'Hodan', 'Kahda']);
  const normalizedSites = siteNames.map((s) => ({ name: s, norm: norm(s) }));

  let maxDate = null;
  for (let r = 1; r < rows.length; r++) {
    const d = new Date(rows[r][idxDate] || '');
    if (!isNaN(d)) maxDate = maxDate ? (d > maxDate ? d : maxDate) : d;
  }
  const windowStart = maxDate ? new Date(maxDate.getTime() - 14 * 24 * 3600 * 1000) : null;

  const agg = new Map();
  for (let r = 1; r < rows.length; r++) {
    const region = (rows[r][idxRegion] || '').trim();
    if (region !== 'Banaadir' && region !== 'Banadir') continue;
    const district = (rows[r][idxDistrict] || '').trim();
    if (!targetDistricts.has(district)) continue;
    const settlement = (rows[r][idxSettlement] || '').trim();
    if (!settlement) continue;
    const arrivals = Number(rows[r][idxArrivals] || 0);
    const d = new Date(rows[r][idxDate] || '');
    if (windowStart && maxDate && !isNaN(d) && (d < windowStart || d > maxDate)) continue;
    // match settlement to known site by exact norm or closest Levenshtein <= 2
    const settlementNorm = norm(settlement);
    let match = normalizedSites.find((s) => s.norm === settlementNorm);
    if (!match) {
      let best = null;
      for (const s of normalizedSites) {
        const dist = levenshtein(settlementNorm, s.norm);
        if (best === null || dist < best.dist) best = { dist, s };
      }
      if (best && best.dist <= 2) match = best.s;
    }
    if (!match) continue;
    const key = match.name.toLowerCase();
    const cur = agg.get(key) || { site: match.name, district, arrivals: 0, reports: [] };
    cur.arrivals += arrivals;
    if (!isNaN(d)) cur.reports.push(d.toISOString());
    agg.set(key, cur);
  }
  return Array.from(agg.values());
}

function main() {
  const displacement = buildDisplacement(baseSites.map((s) => s.name));
  const displacementByName = new Map(displacement.map((d) => [d.site.toLowerCase(), d]));
  const districtRotation = ['Dayniile', 'Hodan', 'Kahda'];

  const mergedSites = baseSites.map((s, idx) => {
    const match = displacementByName.get(s.name.toLowerCase());
    return {
      ...s,
      district: match?.district || districtRotation[idx % districtRotation.length],
      newArrivals14d: match?.arrivals ?? Math.round(s.households * 0.12),
    };
  });

  const generatedDisplacement = displacement.map((d, idx) => ({
    id: `ETT-${idx + 1}`,
    site: d.site,
    district: d.district,
    arrivals: d.arrivals,
    reportedAt: d.reports.sort().slice(-1)[0] || new Date().toISOString(),
  }));

  const outPath = path.join(dataDir, 'nabad.generated.ts');
  fs.writeFileSync(
    outPath,
    `// Auto-generated from CSV + fixed site list. Do not edit by hand.\n` +
      `export const generatedSites = ${JSON.stringify(mergedSites, null, 2)} as const;\n` +
      `export const generatedDisplacement = ${JSON.stringify(generatedDisplacement, null, 2)} as const;\n`
  );
  console.log(`Wrote ${mergedSites.length} sites; arrivals filled for ${generatedDisplacement.length} sites -> ${outPath}`);
}

main();
