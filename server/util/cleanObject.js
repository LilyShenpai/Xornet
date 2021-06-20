/**
 * Checks if a property is basically valid meaning it shouldn't have an empty string
 * dashes or 'Default string' etc in the property
 * @param {String} value to test
 * @returns {Boolean} if the valid is correct or not
 */
function isValidSpecProperty(value) {
  return value && value !== "" && !/(default string)|(unknown)|[-]/gi.test(value);
}

/**
 * @author Geoxor
 * 
 * Recursively removes empty strings and 'Default string' properties
 * From an object
 *
 * This function is very directed towards this one usecase so don't
 * use it in other places unless you know what you're doing
 * @param {Object} object the object to clean
 * @returns {Object} cleaned object
 */
module.exports = function cleanObject(object) {
  if (!object) return {};
  let newObject = {};
  for (const [key, value] of Object.entries(object)) {
    if (isValidSpecProperty(value)) {
      if (value instanceof Object) {
        newObject[key] = cleanObject(value);
      } else if (Array.isArray(value)) {
        for (i in array) {
          if (array[i] instanceof Object) {
            newObject[key][i] = cleanObject(array[i]);
          } else {
            newObject[key][i] = array[i];
          }
        }
      } else {
        newObject[key] = value;
      }
    }
  }
  return newObject;
};
