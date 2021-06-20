const express = require("express");
const router = express.Router();
const Stats = require("@/models/Stats.js");
const Machine = require("@/models/Machine.js");
const Datacenter = require("@/models/Datacenter.js");
const auth = require("@/middleware/auth.js");
const cleanObject = require("@/util/cleanObject.js");
const io = require("..");

// Gets the entire xornet's infrustrucutre's daily traffic
router.get("/stats/daily-traffic", async (req, res) => {
  res.status(200).json(await Stats.fetchDailyTraffic(86400000));
});

// Gets the machines last few history network properties for the graphs
router.get("/stats/network/:machine", auth, async (req, res) => {
  res.status(200).json(await Stats.fetchMachineNetwork(req.params.machine));
});

// TODO: Add the user's ID in the machine so we can auth the machines to users
// so random people wont be able to get people's details cus they kinda
// important to keep a secret you know?
router.get("/stats/machine/:machineUUID?", auth, async (req, res) => {
  const machine = await Machine.findOne({ _id: req.params.machineUUID });
  const datacenter = await Datacenter.findOne({ machines: req.params.machineUUID });

  // TODO: turn these into a middleware for future use
  if (!req.user.machines.includes(machine._id) && !datacenter?.members.includes(req.user._id) && !req.user.is_admin) return res.status(403).json({ message: "you don't have permission to view this machine" });
  if (!machine) return res.status(404).json({ message: "machine not found" });

  // Delete this useless property
  // TODO: probably should make it so these don't exist in the first place
  // and add some sort of validation on the staticData
  delete machine.static.version;
  machine.static.ram = machine.static.memLayout;
  machine.static.disk = machine.static.diskLayout;
  delete machine.static.memLayout;
  delete machine.static.diskLayout;

  res.status(200).json(cleanObject(machine.static));
});

router.get("/stats/processes/:machineUUID?", auth, async (req, res) => {
  return res.status(200).json(
    await new Promise(async (resolve) => {
      const machine = await Machine.findOne({ _id: req.params.machineUUID });
      const datacenter = await Datacenter.findOne({ machines: req.params.machineUUID });

      // TODO: turn these into a middleware for future use
      if (!req.user.machines.includes(machine._id) && !datacenter?.members.includes(req.user._id) && !req.user.is_admin) return res.status(403).json({ message: "you don't have permission to view this machine" });
      if (!machine) return res.status(404).json({ message: "machine not found" });

      // Send a event to get the processes to this specific reporter
      io.sockets.in(`reporter-${req.params.machineUUID}`).emit("getProcesses");

      // After 5 seconds send a rejection if the machine doesn't respond
      const timeout = setTimeout(() => res.status(404).json({ message: "machine did not respond to request" }), 5000);

      // Get the room that reporter is in
      const room = io.sockets.adapter.rooms.get(`reporter-${req.params.machineUUID}`);

      // Respond if the machine isn't online
      if (!room) return res.status(404).json({ message: "machine not online" });

      // Get the socket instance from that room since theres always gonna be only 1 reporter on each room
      const socket = io.sockets.sockets.get(Array.from(room)[0]);

      // When we get the response from the reporter resole the HTTP request
      socket.on("processes", (processes) => {
        clearTimeout(timeout);
        resolve(processes);
      });
    })
  );
});

module.exports = router;
