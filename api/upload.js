const handler = require("../upload");

module.exports = async function (req, res) {
  return handler(req, res);
};
