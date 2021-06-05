/**
 * Gets the system geolocation using the 'IPWHOIS' API.
 * We take the IP, Location, Country Code and ISP and return it as an object.
 * @returns
 */
const axios = require("axios");

module.exports = async function getLocation() {
  location = (await axios.get(`https://ipwhois.app/json/`)).data;
  return {
    ip: location.ip,
    location: location.country,
    countryCode: location.country_code,
    isp: location.isp,
  };
}