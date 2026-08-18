const { createClient } = require("@supabase/supabase-js");

const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "lineups";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials are missing.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const pathname = searchParams.get("pathname");

  if (!pathname) {
    res.status(400).json({ error: "pathname is required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download(pathname);

    if (error || !data) {
      console.error("Supabase download failed:", { pathname, error });
      res.status(404).send("Not found");
      return;
    }

    const contentType = data.type || "application/octet-stream";
    const buffer = Buffer.from(await data.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).end(buffer);
  } catch (e) {
    console.error("Supabase view failed:", e);
    res.status(500).json({ error: e.message || "Image load failed." });
  }
};
