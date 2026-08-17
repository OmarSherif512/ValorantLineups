const { getDataArray } = require("./store");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const data = await getDataArray();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};