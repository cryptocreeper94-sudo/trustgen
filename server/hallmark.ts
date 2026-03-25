import crypto from "crypto";

const PREFIX = "TG";
const COUNTER_ID = "tg-master";
let counter = 0;

function sha256(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function simulatedTxHash(): string {
  return "0x" + crypto.randomBytes(32).toString("hex");
}

function simulatedBlockHeight(): string {
  return String(Math.floor(1_000_000 + Math.random() * 9_000_000));
}

export function getAffiliateTier(count: number) {
  if (count >= 50) return { tier: "diamond", rate: 20 };
  if (count >= 30) return { tier: "platinum", rate: 17.5 };
  if (count >= 15) return { tier: "gold", rate: 15 };
  if (count >= 5) return { tier: "silver", rate: 12.5 };
  return { tier: "base", rate: 10 };
}

export interface HallmarkRecord {
  thId: string; appId: string; appName: string; productName: string;
  releaseType: string; dataHash: string; txHash: string;
  blockHeight: string; verificationUrl: string; hallmarkId: number;
  metadata: Record<string, any>; createdAt: string;
}

const hallmarkStore: HallmarkRecord[] = [];

export function generateHallmark(data: {
  appId: string; appName: string; productName: string;
  releaseType: string; userId?: string; metadata?: Record<string, any>;
}): HallmarkRecord {
  counter++;
  const thId = `${PREFIX}-${counter.toString().padStart(8, "0")}`;
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ thId, ...data, timestamp });
  const dataHash = sha256(payload);

  const record: HallmarkRecord = {
    thId, appId: data.appId, appName: data.appName,
    productName: data.productName, releaseType: data.releaseType,
    dataHash, txHash: simulatedTxHash(), blockHeight: simulatedBlockHeight(),
    verificationUrl: `https://trustgen.tlid.io/api/hallmark/${thId}/verify`,
    hallmarkId: counter, metadata: data.metadata || {}, createdAt: timestamp,
  };
  hallmarkStore.push(record);
  console.log(`[HALLMARK] ${PREFIX}: Issued ${thId} — ${data.productName}`);
  return record;
}

export function verifyHallmark(thId: string) {
  const h = hallmarkStore.find(r => r.thId === thId);
  if (!h) return { verified: false, error: "Hallmark not found" };
  return { verified: true, hallmark: h };
}

export function getGenesisHallmark(): HallmarkRecord | null {
  return hallmarkStore.find(r => r.thId === `${PREFIX}-00000001`) || null;
}

export function seedGenesisHallmark(): HallmarkRecord {
  const existing = getGenesisHallmark();
  if (existing) return existing;
  counter = 0;
  return generateHallmark({
    appId: "trustgen3d-genesis", appName: "TrustGen 3D", productName: "Genesis Block",
    releaseType: "genesis", metadata: {
      ecosystem: "Trust Layer", version: "1.0.0", domain: "trustgen.tlid.io",
      operator: "DarkWave Studios LLC", chain: "Trust Layer Blockchain",
      consensus: "Proof of Trust", launchDate: "2026-08-23T00:00:00.000Z",
      nativeAsset: "SIG", utilityToken: "Shells",
      parentApp: "Trust Layer Hub", parentGenesis: "TH-00000001",
    },
  });
}

export function getAllHallmarks(): HallmarkRecord[] { return hallmarkStore; }
export function getHallmarkStats() { return { total: hallmarkStore.length, genesisExists: !!getGenesisHallmark() }; }

export function createTrustStamp(userId: string|null, category: string, data: Record<string,any>) {
  const payload = { ...data, appContext: "trustgen3d", timestamp: new Date().toISOString() };
  const hash = sha256(JSON.stringify(payload));
  console.log(`[TRUST STAMP] ${category} — hash: ${hash.slice(0,16)}...`);
  return { category, dataHash: hash, txHash: simulatedTxHash(), blockHeight: simulatedBlockHeight() };
}

// === Express routes ===
import type { Express, Request, Response } from "express";

export function registerHallmarkRoutes(app: Express) {
  app.get("/api/hallmark/genesis", (_req: Request, res: Response) => {
    res.json(seedGenesisHallmark());
  });
  app.get("/api/hallmark/app", (_req: Request, res: Response) => {
    const h = getGenesisHallmark();
    if (!h) return res.status(404).json({ error: "Hit /api/hallmark/genesis first" });
    res.json(h);
  });
  app.get("/api/hallmark/all", (_req: Request, res: Response) => {
    res.json({ hallmarks: getAllHallmarks(), count: hallmarkStore.length });
  });
  app.get("/api/hallmark/:id/verify", (req: Request, res: Response) => {
    const result = verifyHallmark(req.params.id as string);
    res.status(result.verified ? 200 : 404).json(result);
  });
  app.get("/api/hallmark/stats", (_req: Request, res: Response) => {
    res.json(getHallmarkStats());
  });
  app.post("/api/hallmark/company/issue", (req: Request, res: Response) => {
    const { productName, releaseType, metadata } = req.body;
    if (!productName) return res.status(400).json({ error: "productName required" });
    const h = generateHallmark({ appId: "trustgen3d", appName: "TrustGen 3D", productName, releaseType: releaseType||"release", metadata });
    res.json({ success: true, hallmark: h });
  });
  console.log("[HALLMARK] TrustGen 3D hallmark routes registered");
}
