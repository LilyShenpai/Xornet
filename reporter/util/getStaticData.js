const si = require("systeminformation");
const getLocation = require("../util/getLocation");
const uuidRegex = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/;

module.exports = async function getStaticData() {
  return new Promise(async (resolve) => {
    const data = await si.getStaticData();
    data.geolocation = await getLocation();
    data.system.uuid = data.uuid.hardware.replace(/-/g, "") || data.uuid.os.replace(/-/g, "");
    if (data.system.uuid == "03000200040005000006000700080009" || !uuidRegex.test(data.system.uuid)) {
      data.system.uuid = data.uuid.os.replace(/-/g, "");
    }
    resolve(data);
  });
};
