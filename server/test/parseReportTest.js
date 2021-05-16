const assert = require("assert");
const parseReport = require('../util/parseReport');

describe("parseReport Test Suit", () => {
  it("Test parseReport with valid Report", () => {
    const report = {
      uuid: "123456789012345678901234567890ab",
      isVirtual: false,
      hostname: "test-debian",
      platform: "linux",
      ram: {
        total: 8000000000,
        free: 2000000000,
      },
      cpu: 30,
      network: [
        { tx_sec: 383.0439223697651, rx_sec: 383.0439223697651 },
        { tx_sec: 98063.32992849847, rx_sec: 96748.72318692543 },
      ],
      reporterVersion: 0.12,
      disks: [
        { fs: '/dev/sda5', use: 3.00 },
        { fs: '/dev/sdb1', use: 74.00 }
      ],
      uptime: 300,
      reporterUptime: 200,
      timestamp: 1621176090,
    }

    const machinePings = new Map([["123456789012345678901234567890ab", 30]]);

    const actualReport = parseReport(report, 0.12, machinePings);

    const expectedReport = {
      uuid: '123456789012345678901234567890ab',
      isVirtual: false,
      hostname: 'test-debian',
      platform: 'linux',
      ram: { total: 7.45, free: 1.86, used: 5.59 },
      cpu: 30,
      network: { totalInterfaces: 2, TxSec: 0.79, RxSec: 0.78 },
      reporterVersion: 0.12,
      disks: [ { fs: '/dev/sda5', use: 3 }, { fs: '/dev/sdb1', use: 74 } ],
      uptime: { pure: 300, formatted: '0d 0h 5m 0s' },
      reporterUptime: 200,
      timestamp: 1621176090,
      rogue: false,
      ping: 30,
    }

    assert.deepStrictEqual(actualReport, expectedReport);
  })
})