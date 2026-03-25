import type { Express, Request, Response } from "express";
import crypto from "crypto";

function generateUniqueHash(): string {
  return crypto.randomBytes(16).toString("hex");
}

const trackLimiter = new Map<string, number>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const last = trackLimiter.get(ip);
  if (last && now - last < 5000) return true;
  trackLimiter.set(ip, now);
  if (trackLimiter.size > 10000) Array.from(trackLimiter.keys()).slice(0, 5000).forEach(k => trackLimiter.delete(k));
  return false;
}

const AFFILIATE_TIERS = {
  base: { rate: 10, min: 0 }, silver: { rate: 12.5, min: 5 },
  gold: { rate: 15, min: 15 }, platinum: { rate: 17.5, min: 30 },
  diamond: { rate: 20, min: 50 },
};

function computeTier(count: number) {
  if (count >= 50) return { tier: "diamond", rate: 20 };
  if (count >= 30) return { tier: "platinum", rate: 17.5 };
  if (count >= 15) return { tier: "gold", rate: 15 };
  if (count >= 5) return { tier: "silver", rate: 12.5 };
  return { tier: "base", rate: 10 };
}

export function registerAffiliateRoutes(app: Express) {
  app.get("/api/affiliate/dashboard", async (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });
    const uniqueHash = generateUniqueHash();
    res.json({
      uniqueHash,
      referralLink: `https://trustgen.tlid.io/ref/${uniqueHash}`,
      tier: computeTier(0),
      stats: { totalReferrals: 0, convertedReferrals: 0, pendingEarnings: "0.00", paidEarnings: "0.00" },
      tiers: AFFILIATE_TIERS,
    });
  });

  app.get("/api/affiliate/link", async (req: Request, res: Response) => {
    const uniqueHash = generateUniqueHash();
    res.json({
      uniqueHash,
      links: {
        trustgen3d: `https://trustgen.tlid.io/ref/${uniqueHash}`,
        trusthub: `https://trusthub.tlid.io/ref/${uniqueHash}`,
        dwtl: `https://dwtl.io/ref/${uniqueHash}`,
      },
    });
  });

  app.post("/api/affiliate/track", async (req: Request, res: Response) => {
    const ip = req.ip || "unknown";
    if (isRateLimited(ip)) return res.status(429).json({ error: "Too many requests" });
    const { referralHash } = req.body;
    if (!referralHash) return res.status(400).json({ error: "referralHash required" });
    res.json({ success: true, message: "Referral tracked", app: "trustgen3d" });
  });

  app.get("/api/affiliate/tiers", (_req: Request, res: Response) => {
    res.json({ tiers: AFFILIATE_TIERS, currency: "SIG", minPayout: 25 });
  });

  console.log("[AFFILIATE] TrustGen 3D affiliate routes registered");
}
