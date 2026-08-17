const { getDataArray, saveDataArray, deleteImages } = require("./store");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const data = await getDataArray();
    await saveDataArray([]);
    for (const item of data) {
      await deleteImages(item.images);
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};