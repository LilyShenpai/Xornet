require("colors");
const Socket = require("socket.io-client").Socket;
const { assert, expect } = require("chai");
const download = require("../util/download");
const getLocation = require("../util/getLocation");
const getStaticData = require("../util/getStaticData");
const getStats = require("../util/getStats");
const getSystemExtension = require("../util/getSystemExtension");
const isSpeedtestInstalled = require("../util/isSpeedtestInstalled");
const connectToXornet = require("../util/connectToXornet");

process.env.TEST_UUID = "00000000000000000000000000000000";

let staticData = null;

describe("All reporter functions", () => {
  it("Can detect if Speedtest is installed", async function () {
    expect(await isSpeedtestInstalled());
  });

  it("Can get binary extentions for system", async function () {
    systemExtension = await getSystemExtension();
    expect([".exe", ".bin", ".dmg"]).to.include(systemExtension);
  });

  it("Can get location object", async function () {
    const actualLocation = await getLocation();
    assert.typeOf(actualLocation.ip, "string");
    assert.typeOf(actualLocation.location, "string");
    assert.typeOf(actualLocation.countryCode, "string");
    assert.typeOf(actualLocation.isp, "string");
  });

  it("Can downloads files successfully", async function () {
    const downloadedFile = await download("https://cdn.discordapp.com/attachments/806300597338767450/850706885099257856/speedtest.exe", true);
    assert.typeOf(downloadedFile, "string");
  });

  it("Can fetch static data", async function () {
    this.timeout(10000);
    staticData = await getStaticData();
    assert.typeOf(staticData, "object");
  });

  it("Can get stats", async function () {
    this.timeout(10000);
    staticData = await getStats(staticData);
    assert.typeOf(staticData, "object");
  });

  it("Can connect to Xornet", async function () {
    this.timeout(10000);
    const xornet = await connectToXornet(staticData, true);
    assert.instanceOf(xornet, Socket);
  });
});
