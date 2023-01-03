const { sqlForPartialUpdate, searchFilter } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("should return object with string of columns to be updated and array of values", function () {
    const result = sqlForPartialUpdate(
      {
        email: "test@email.com",
        firstName: "TestUser"
    },
      {
        firstName: "first_name"
      });
    expect(result.setCols).toEqual('"email"=$1, "first_name"=$2');
    expect(result.values).toEqual(["test@email.com", "TestUser"]);
    expect(result instanceof Object).toEqual(true)
  });
});

describe("searchFilter", function () {
  test("should return object with string of columns and array of values", function () {
    const result = searchFilter(
      {
        name: "test",
        minEmployees: 1
    });
    expect(result.cols).toEqual('name ILIKE $1 AND num_employees >= $2');
    expect(result.values).toEqual(["%test%", 1]);
    expect(result instanceof Object).toEqual(true)
  });
  test("should return object with empty values if no data passed", function () {
    const result = searchFilter({});
    expect(result.cols).toEqual('');
    expect(result.values).toEqual([]);
    expect(result instanceof Object).toEqual(true)
  });
});