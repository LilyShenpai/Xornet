const Datacenter = require("@/models/Datacenter.js");
const UUIDRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

let auth = async (req, res, next) => {
  if (!req.params.datacenter) return res.status(401).json({ message: "You didn't specify a name or UUID in your parameters" });

  if (UUIDRegex.test(req.params.datacenter)) req.user.datacenters = await Datacenter.find({ _id: req.params.datacenter }).exec();
  else req.user.datacenters = await Datacenter.find({ name: req.params.datacenter }).exec();

  if (req.user.datacenters.some((datacenter) => datacenter.owner === req.user._id || datacenter.members.includes(req.user._id)) || req.user.is_admin) {
    next();
  } else return res.status(401).json({ message: "You don't have access to view this datacenter" });
};

module.exports = auth;
