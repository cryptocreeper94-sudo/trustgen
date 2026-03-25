import type { Express, Request, Response } from "express";

const ECOSYSTEM_APPS = [
  { slug: "signalcast", name: "SignalCast", domain: "signalcast.tlid.io", type: "Marketing Automation" },
  { slug: "happyeats", name: "Happy Eats", domain: "happyeats.app", type: "Food Delivery" },
  { slug: "tldriverconnect", name: "TL Driver Connect", domain: "tldriverconnect.com", type: "Rideshare" },
  { slug: "paintpros", name: "PaintPros", domain: "paintpros.io", type: "Home Services" },
  { slug: "orbitstaffing", name: "ORBIT Staffing", domain: "orbitstaffing.io", type: "Staffing OS" },
  { slug: "lotopspro", name: "LotOps Pro", domain: "lotopspro.io", type: "Dealership Ops" },
  { slug: "brewandboard", name: "Brew & Board", domain: "brewandboard.coffee", type: "B2B Coffee" },
  { slug: "lumeline", name: "LumeLine", domain: "lumeline.tlid.io", type: "Odds Intelligence" },
  { slug: "trustgolf", name: "Trust Golf", domain: "trustgolf.app", type: "Golf Community" },
  { slug: "trustvault", name: "TrustVault", domain: "trustvault.tlid.io", type: "Digital Vault" },
  { slug: "trusthome", name: "TrustHome", domain: "trusthome.tlid.io", type: "Real Estate" },
  { slug: "vedasolus", name: "VedaSolus", domain: "vedasolus.io", type: "Wellness" },
  { slug: "verdara", name: "Verdara", domain: "verdara.tlid.io", type: "Sustainability" },
  { slug: "thevoid", name: "THE VOID", domain: "intothevoid.app", type: "Creative Platform" },
  { slug: "darkwavestudios", name: "DarkWave Studios", domain: "studio.tlid.io", type: "IDE" },
  { slug: "bomber3d", name: "Bomber 3D", domain: "bomber.tlid.io", type: "Gaming" },
  { slug: "trustgen3d", name: "TrustGen 3D", domain: "trustgen.tlid.io", type: "3D Generator" },
  { slug: "garagebot", name: "GarageBot", domain: "garagebot.io", type: "Automotive AI" },
  { slug: "lume", name: "Lume", domain: "lume-lang.org", type: "Programming Language" },
  { slug: "darkwavepulse", name: "Pulse", domain: "darkwavepulse.com", type: "Analytics" },
  { slug: "strikeagent", name: "StrikeAgent", domain: "strikeagent.io", type: "Sales AI" },
  { slug: "chronicles", name: "Chronicles", domain: "yourlegacy.io", type: "Digital Legacy" },
];

export function registerEcosystemRoutes(app: Express) {
  app.get("/api/ecosystem/status", (_req: Request, res: Response) => {
    res.json({
      app: "trustgen3d", domain: "trustgen.tlid.io", ecosystem: "Trust Layer",
      sso: { enabled: true, provider: "dwtl.io" },
      hallmarks: { enabled: true, prefix: "TG" },
      affiliate: { enabled: true, tiers: ["base","silver","gold","platinum","diamond"], currency: "SIG" },
      trustStamps: { enabled: true },
      version: "1.0.0", timestamp: new Date().toISOString(),
    });
  });
  app.get("/api/ecosystem/identity", (req: Request, res: Response) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "x-user-id header required" });
    res.json({ userId, ssoProvider: "dwtl.io", ecosystemApps: ECOSYSTEM_APPS.length, hub: "https://dwtl.io" });
  });
  app.get("/api/ecosystem/apps", (_req: Request, res: Response) => {
    res.json({ apps: ECOSYSTEM_APPS, count: ECOSYSTEM_APPS.length, ssoProvider: "dwtl.io" });
  });
  console.log("[ECOSYSTEM] TrustGen 3D ecosystem routes registered");
}
