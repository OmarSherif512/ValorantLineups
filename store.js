const { list, put, del, get } = require("@vercel/blob");

async function getDataArray() {
  const { blobs } = await list({ prefix: "data.json", limit: 1 });
  if (!blobs.length) return [];

  const result = await get(blobs[0].pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return [];

  const text = await new Response(result.stream).text();
  const arr = JSON.parse(text);
  return Array.isArray(arr) ? arr : [];
}

async function saveDataArray(arr) {
  await put("data.json", JSON.stringify(arr), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function deleteImages(images) {
  if (!images) return;

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