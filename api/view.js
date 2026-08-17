const { get } = require("@vercel/blob");

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
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      res.status(404).send("Not found");
      return;
    }

    res.setHeader("Content-Type", result.blob?.contentType || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (result.stream) {
      result.stream.pipe(res);
      return;
    }

    res.status(200).send(result.body || result.blob || "");
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
