const { getDataArray, saveDataArray } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const entry = req.body;
  if (!entry || !entry.id || !entry.name || !entry.map) {
    res.status(400).json({ error: "id, name and map are required" });
    return;
  }

  try {
    const data = await getDataArray();
    data.push(entry);
    await saveDataArray(data);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};