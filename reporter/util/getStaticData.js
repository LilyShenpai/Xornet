const si = require("systeminformation");

module.exports = async function getStaticData(){
  return new Promise(async resolve => {
    console.log("[INFO]".bgCyan.black + ` Fetching static data...`);
    const data = await si.getStaticData();
    console.log("[INFO]".bgCyan.black + ` Static data collected`.green);
    resolve(data);
  });
}