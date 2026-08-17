const { getDataArray, saveDataArray, deleteImages } = require("./store");

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
    const data = await getDataArray();
    const target = data.find(i => i.id === id);
    const remaining = data.filter(i => i.id !== id);
    await saveDataArray(remaining);
    if (target) await deleteImages(target.images);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};