const { put } = require("@vercel/blob");

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

  try {
    const blob = await put(`images/${id}-${slot}.jpg`, buffer, {
      access: "private",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true
    });
    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};