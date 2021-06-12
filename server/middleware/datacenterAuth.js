const Datacenter = require("@/models/Datacenter.js");

let auth = async (req, res, next) => {
  if(req.params.datacenterUUID){
    req.user.datacenters = await Datacenter.find({_id: req.params.datacenterUUID}).exec();
  } else if(req.params.datacenterName){
    req.user.datacenters = await Datacenter.find({name: req.params.datacenterName}).exec();
  }
  if (req.user.datacenters.some(datacenter => datacenter.owner === req.user._id) || datacenter.members.includes(req.user._id) || req.user.is_admin){
    next();
  }
  else return res.status(401).json({ message: "You don't have access to view this datacenter"});
};

module.exports = auth;
