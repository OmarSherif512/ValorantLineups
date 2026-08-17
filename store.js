const { list, put, del, get } = require("@vercel/blob");

function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN in the Vercel project environment and redeploy.");
  }
}

async function getDataArray() {
  assertBlobConfigured();

  const { blobs } = await list({ prefix: "data.json", limit: 1 });
  if (!blobs.length) return [];

  const result = await get(blobs[0].pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return [];

  const text = await new Response(result.stream).text();
  const arr = JSON.parse(text);
  return Array.isArray(arr) ? arr : [];
}

async function saveDataArray(arr) {
  assertBlobConfigured();

  await put("data.json", JSON.stringify(arr), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function deleteImages(images) {
  if (!images) return;
  assertBlobConfigured();

  const paths = Object.values(images)
    .filter(Boolean)
    .map(value => {
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return new URL(value).pathname.replace(/^\/+/, "");
      }
      return value;
    })
    .filter(Boolean);

  if (paths.length) await del(paths);
}

module.exports = { getDataArray, saveDataArray, deleteImages };