const si = require("systeminformation");
const getLocation = require("../util/getLocation");

module.exports = async function getStaticData(){
  return new Promise(async resolve => {
    const data = await si.getStaticData();
    data.geolocation = await getLocation();
    data.system.uuid = data.uuid.hardware.replace(/-/g, "") || data.uuid.os.replace(/-/g, "");
    resolve(data);
  });
}