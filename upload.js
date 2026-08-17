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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({
      error: "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN in the Vercel project environment and redeploy."
    });
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
    console.error("Blob upload failed:", e);
    const message = e?.message || "Image upload failed.";
    res.status(500).json({
      error: message,
      message: message
    });
  }
};