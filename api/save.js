const handler = require("../save");

module.exports = async function (req, res) {
  return handler(req, res);
};
