const Datacenter = require("@/models/Datacenter.js");

let auth = async (req, res, next) => {
  req.user.datacenters = await Datacenter.find({_id: req.params.datacenterUUID}).exec();
  if (req.user.datacenters.some(datacenter => datacenter._id === req.params.datacenterUUID) || req.user.is_admin) next();
  else return res.status(401).json({ message: "You don't have access to view this datacenter"});
};

module.exports = auth;
