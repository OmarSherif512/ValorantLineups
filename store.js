const { createClient } = require("@supabase/supabase-js");

const SUPABASE_TABLE_NAME = process.env.SUPABASE_TABLE_NAME || "lineups";
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "lineups";

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

function normalizeRow(row) {
  if (!row) return row;
  return {
    ...row,
    images: row.images || {},
    thumb: row.thumb || null
  };
}

async function getDataArray() {
  const supabase = getSupabase();
  console.log("Reading from Supabase table:", SUPABASE_TABLE_NAME);

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Supabase table read result:", { data, error });
    if (error) throw error;
    return (data || []).map(normalizeRow);
  } catch (e) {
    console.error("Supabase read failed:", e);
    throw e;
  }
}

async function saveDataArray(arr) {
  const supabase = getSupabase();
  console.log("Saving to Supabase table:", SUPABASE_TABLE_NAME, "rows:", arr);

  if (!arr || !arr.length) {
    const { data, error } = await supabase.from(SUPABASE_TABLE_NAME).delete().neq("id", "");
    console.log("Supabase clear result:", { data, error });
    if (error) throw error;
    return;
  }

  const rows = arr.map(normalizeRow);
  const { data, error } = await supabase.from(SUPABASE_TABLE_NAME).upsert(rows, { onConflict: "id" });
  console.log("Supabase upsert result:", { data, error });
  if (error) throw error;
}

async function deleteImages(images) {
  if (!images) return;

  const supabase = getSupabase();
  const paths = Object.values(images)
    .filter(Boolean)
    .map(value => {
      if (typeof value !== "string") return null;
      if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          const url = new URL(value);
          const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
          return match ? decodeURIComponent(match[1]) : null;
        } catch (e) {
          return null;
        }
      }
      return value;
    })
    .filter(Boolean);

  if (!paths.length) return;

  const { error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).remove(paths);
  if (error) throw error;
}

module.exports = { getDataArray, saveDataArray, deleteImages };