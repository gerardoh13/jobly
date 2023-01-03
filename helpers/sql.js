const { BadRequestError } = require("../expressError");

/** returns an object with 2 key value pairs.
 * setCols: a string of columns to be updated in sanitized SQL format
 * values: an array of values. Each value's index matches the index of the column to be updated
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** returns an object with 2 key value pairs.
 * cols: a string of columns sanitized SQL format
 * values: an array of values. 
 *  */
function searchFilter(data) {
  let cols = [];
  const values = [];
  if (!data){
    return { cols: "", values };
  }
  if (data.name) {
    cols.push(`name ILIKE $${cols.length + 1}`);
    values.push(`%${data.name}%`);
  }
  if (data.minEmployees) {
    cols.push(`num_employees >= $${cols.length + 1}`);
    values.push(data.minEmployees);
  }
  if (data.maxEmployees) {
    cols.push(`num_employees <= $${cols.length + 1}`);
    values.push(data.maxEmployees);
  }
  cols = cols.join(" AND ");

  return { cols, values };
}

module.exports = { sqlForPartialUpdate, searchFilter };
