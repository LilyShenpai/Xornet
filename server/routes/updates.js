const express = require("express");
const router = express.Router();

router.get("/updates", async (req, res) => {
  let latestVersion;
  try {
    const { data } = await axios.get("https://api.github.com/repos/Geoxor/Xornet/releases");
    latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
  } catch (error) {}

  res.json({
    latestVersion,
    downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
  });
});

module.exports = router;
