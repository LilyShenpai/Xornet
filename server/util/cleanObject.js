/**
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
    if (value !== "" && value !== "Default string") {
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
