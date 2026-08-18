const { createClient } = require("@supabase/supabase-js");

const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "lineups";

console.log("Called SUPABASE");
console.log("Supabase bucket name:", SUPABASE_BUCKET_NAME);

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_ANON_KEY;

  console.log("Supabase debug:", {
    hasUrl: Boolean(url),
    url,
    hasKey: Boolean(key),
    bucket: SUPABASE_BUCKET_NAME,
    keyPrefix: key ? key.slice(0, 12) : null
  });

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
    console.log("Uploading to Supabase bucket:", SUPABASE_BUCKET_NAME, "path:", filePath);

    const { data: bucketListData, error: bucketListError } = await supabase.storage.listBuckets();
    console.log("Supabase bucket list:", bucketListData, "bucketListError:", bucketListError);

    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: "image/jpeg",
        upsert: true
      });

    console.log("Supabase upload result:", { data, error });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(SUPABASE_BUCKET_NAME).getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl || data?.path || filePath;

    console.log("Supabase public URL:", publicUrl);
    res.status(200).json({ url: publicUrl, pathname: filePath });
  } catch (e) {
    console.error("Supabase upload failed:", e);
    const message = e?.message || "Image upload failed.";
    res.status(500).json({ error: message, message });
  }
};