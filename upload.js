const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials are missing. Add NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_URL and a Supabase key to the project environment.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { id, slot, dataUrl } = req.body || {};
  if (!id || !slot || !dataUrl) {
    res.status(400).json({ error: "id, slot and dataUrl are required" });
    return;
  }

  const match = /^data:image\/(\w+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    res.status(400).json({ error: "dataUrl must be a base64 image" });
    return;
  }

  const buffer = Buffer.from(match[2], "base64");
  const extension = match[1] === "jpeg" ? "jpg" : match[1] || "jpg";
  const filePath = `images/${id}-${slot}.${extension}`;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from("lineups")
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from("lineups").getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl || data?.path || filePath;

    res.status(200).json({ url: publicUrl, pathname: filePath });
  } catch (e) {
    console.error("Supabase upload failed:", e);
    const message = e?.message || "Image upload failed.";
    res.status(500).json({ error: message, message });
  }
};