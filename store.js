const { list, put, del } = require("@vercel/blob");

async function getDataArray() {
  const { blobs } = await list({ prefix: "data.json", limit: 1 });
  if (!blobs.length) return [];
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  if (!res.ok) return [];
  const arr = await res.json();
  return Array.isArray(arr) ? arr : [];
}

async function saveDataArray(arr) {
  await put("data.json", JSON.stringify(arr), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function deleteImages(images) {
  if (!images) return;
  const urls = Object.values(images).filter(Boolean);
  if (urls.length) await del(urls);
}

module.exports = { getDataArray, saveDataArray, deleteImages };