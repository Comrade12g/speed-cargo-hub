import express from "express";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = new Set(["https://speedcargogh.com", "https://www.speedcargogh.com"]);
const attempts = new Map<string, { count: number; resetAt: number }>();
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient("https://vtmltgqdegrhhoxtegkt.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

app.get("/api/track/:entry_number", async (req, res) => {
  const origin = req.get("origin");
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) attempts.set(ip, { count: 1, resetAt: now + 60_000 });
  else if (current.count >= 30) return res.status(429).json({ error: "Too many tracking requests. Please try again shortly." });
  else current.count += 1;

  const entryNumber = req.params.entry_number.trim().toUpperCase();
  if (!/^(GHY\d{3,}|GZG\d{3,}|HTG-\d+)$/.test(entryNumber)) return res.status(400).json({ error: "Invalid tracking number format." });
  try {
    if (supabase) {
      const { data, error } = await supabase.rpc("track_entry", { p_entry_number: entryNumber });
      if (error) throw error;
      if (!data) return res.status(404).json({ error: `No shipment found for ${entryNumber}.` });
      return res.json(data);
    }
    const response = await fetch(`https://vtmltgqdegrhhoxtegkt.supabase.co/functions/v1/track?entry_number=${encodeURIComponent(entryNumber)}`);
    return res.status(response.status).json(await response.json());
  } catch (error) {
    console.error("Tracking request failed", error);
    return res.status(500).json({ error: "Unable to retrieve tracking information." });
  }
});

const dist = path.resolve(process.cwd(), "dist");
app.use(express.static(dist));
app.use((_req, res) => res.sendFile(path.join(dist, "index.html")));
app.listen(port, () => console.info(`Speed Cargo Hub listening on port ${port}`));
