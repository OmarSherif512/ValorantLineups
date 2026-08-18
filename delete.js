const { getDataArray, deleteImages } = require("./store");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_TABLE_NAME = process.env.SUPABASE_TABLE_NAME || "lineups";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_VALORANT_LINEUPSSUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase credentials are missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const { id } = req.body || {};
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }

  try {
    const supabase = getSupabase();
    const data = await getDataArray();
    const target = data.find(i => i.id === id);
    
    if (!target) {
      res.status(404).json({ error: "lineup not found" });
      return;
    }

    console.log("Deleting lineup with id:", id);
    const { error: deleteError } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .delete()
      .eq("id", id);
    
    console.log("Supabase delete result:", { deleteError });
    if (deleteError) throw deleteError;
    
    if (target.images) await deleteImages(target.images);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Delete failed:", e);
    res.status(500).json({ error: e.message });
  }
};