const fs = require("fs");

/**
 * @author Geoxor
 *
 * Saves an image to the backend
 * @param {image} The image blob from JIMP
 * @returns {URL} Of where the file is on the backend
 */

module.exports = async function saveImage(image) {
  return new Promise(async (resolve, reject) => {
    let date = Date.now();
    // Moves the image file from the temporary file to the main uploads folder with a date appended to it
    fs.rename(`./temp/${image.filename}`, `./uploads/images/${date}-${image.originalname}`, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve({
        url: `https://backend.xornet.cloud/images/${date}-${image.originalname}`.replace(/\s/g, "%20"),
      });
    });
  });
};
