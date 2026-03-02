import { randomUUID } from 'crypto';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { SiteRow, listSites, upsertSites } from '../repositories/sitesRepository';
import { createImportJob, listPendingImports, markImportJob, markTempSaved } from '../repositories/importsRepository';

function yes(val: any) {
  return typeof val === 'string' && val.trim().toLowerCase() === 'yes';
}

function mapNeeds(row: Record<string, any>) {
  return {
    protection: yes(row['Needs - General Protection Services']) || yes(row['Needs - GBV Services']) || yes(row['Needs - Child Protection Services']),
    food: yes(row['Needs - General Food distribution']),
    health: yes(row['Needs - Health Services']),
    wash: yes(row['Needs - Water Services']) || yes(row['Needs - Sanitation Services (latrines etc)']) || yes(row['Needs - Hygiene services (soap, hygiene kits, etc)']),
    newArrivals: yes(row['New arrivals since last week']),
  };
}

export async function getSites() {
  return listSites();
}

export async function importXlsx(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { raw: false });

  console.log(`Parsed ${records.length} rows from the uploaded file.`, records);

  const rows: SiteRow[] = records
    .map((row, idx) => {
      const id = row['Settlement ID'] || row['settlement_id'] || row['Site Code'] || `ETT-${idx}-${Date.now()}` || randomUUID();
      const lat = row['Latitude'] ? Number(row['Latitude']) : null;
      const lon = row['Longitude'] ? Number(row['Longitude']) : null;
      return {
        id,
        settlement_name: row['Settlement Name'] ?? row['settlement_name'] ?? row['Site name'],
        district: row['District Name'] ?? row['district'],
        region: row['Region Name'] ?? row['region'],
        ochaRegionPcode: row['OCHA Region Pcode'] ?? null,
        ochaDistrictPcode: row['OCHA District Pcode'] ?? null,
        operationalZone: row['Operational Zone'] ?? null,
        catchment: row['Catchment'] ?? null,
        classification: row['Settlement Classification'] ?? null,
        locationType: row['Location Type'] ?? null,
        lat,
        lon,
        households: row['Total HH'] ? Number(row['Total HH']) : null,
        arrivals14d: row['Total new arrivals since last week'] ? Number(row['Total new arrivals since last week']) : null,
        arrivalsMale: row['Number of Males (18 and above) since last week'] ? Number(row['Number of Males (18 and above) since last week']) : null,
        arrivalsFemale: row['Number of Females (18 and above) since last week'] ? Number(row['Number of Females (18 and above) since last week']) : null,
        arrivalsChildren: row['Number of Children under 18 since last week'] ? Number(row['Number of Children under 18 since last week']) : null,
        departures14d: row['Total number of departures since last week'] ? Number(row['Total number of departures since last week']) : null,
        mainCause: row['Main Cause of Displacement'] ?? null,
        hazardCause: row['Main Cause of Displacement (type of Natural hazard)'] ?? null,
        conflictCause: row['Main Cause of Displacement (type of conflict)'] ?? null,
        mainNeed: row['Main need for the majority of IDPs in settlement'] ?? null,
        needs: mapNeeds(row),
        responses: {
          food: yes(row['Response - General food distribution to new arrivals']),
          shelter: yes(row['Response - Shelter Materials']),
          nfi: yes(row['Response - NFIs']),
          health: yes(row['Response - Health Services']),
          nutrition: yes(row['Response - Nutrition Services']),
          water: yes(row['Response - Water Services']),
          sanitation: yes(row['Response - Sanitation Services (latrines etc)']),
          hygiene: yes(row['Response - Hygiene Services (soap, hygiene kits, etc)']),
          protection: yes(row['Response - General Protection Services']),
          gbv: yes(row['Response - GBV Services']),
          cccm: yes(row['Response - CCCM Site Improvement']) || yes(row['Response - CCCM Site Decongestion']) || yes(row['Response - CCCM Complaints and Feedback Mechanism']) || yes(row['Response - CCCM Plot Allocation']),
        },
        movementType: row['Type of movement of the majority of the new arrivals'] ?? null,
        displacementCount: row['How many times was the majority displaced since they left place of origin'] ?? null,
        journeyTime: row['How long did the whole journey take for the majority'] ?? null,
        originRegion: row['Somalia Region of Origin'] ?? row['Origin_Region_country'] ?? null,
        originDistrict: row['Somalia District of Origin'] ?? row['Origin_District_country'] ?? null,
        originLocation: row['Somalia Location of Origin'] ?? null,
        dataCollectionWeek: row['Data Collection Week'] ?? null,
        penta3: row['Penta3 coverage'] ? Number(row['Penta3 coverage']) : null,
        gam: row['GAM prevalence'] ? Number(row['GAM prevalence']) : null,
        safety: row['Safety Index'] ? Number(row['Safety Index']) : null,
        raw: row,
      };
    })
    .filter((r) => r.settlement_name);

  const count = await upsertSites(rows);
  return { imported: count };
}

const tempDir = path.resolve(process.cwd(), 'tmp', 'imports');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

let processing = false;

export async function startImportJob(buffer: Buffer, filename: string) {
  const job = await createImportJob(filename);
  try {
    const tempPath = path.join(tempDir, `${job.id}-${filename}`);
    fs.writeFileSync(tempPath, buffer);
    await markTempSaved(job.id, tempPath);
    triggerProcessing();
  } catch (err: any) {
    await markImportJob(job.id, 'failed', err?.message ?? 'Failed to save temp file');
  }
  return job.id;
}

async function processJob(jobId: string, tempPath: string) {
  try {
    const fileBuffer = fs.readFileSync(tempPath);
    await importXlsx(fileBuffer);
    await markImportJob(jobId, 'done');
  } catch (err: any) {
    await markImportJob(jobId, 'failed', err?.message ?? 'Import failed');
  }
}

export async function triggerProcessing() {
  if (processing) return;
  processing = true;
  setImmediate(async () => {
    try {
      const pending = await listPendingImports();
      for (const job of pending) {
        if (job.tempPath) {
          await processJob(job.id, job.tempPath);
        } else {
          await markImportJob(job.id, 'failed', 'Temp file missing');
        }
      }
    } finally {
      processing = false;
    }
  });
}
