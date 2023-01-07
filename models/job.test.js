"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getValidJobId
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  let newJob = {
    title: "developer",
    salary: 80000,
    equity: 0.05,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    const ID = job.id;
    newJob.id = ID;
    job.equity = parseFloat(job.equity);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [ID]
    );
    expect(result.rows).toEqual([
      {
        id: ID,
        title: "developer",
        salary: 80000,
        equity: "0.05",
        companyHandle: "c1",
      },
    ]);
  });
  test("bad request with bad handle", async function () {
    try {
      let jobBadHandle = {...newJob}
      jobBadHandle.companyHandle = "c999"
      await Job.create(jobBadHandle);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "cat wrangler",
        salary: 150000,
        equity: "0.75",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "test job",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "test job2",
        salary: 80000,
        equity: null,
        companyHandle: "c2",
      },
    ]);
  });
  test("works: w/ title filter", async function () {
    let jobs = await Job.findAll({
      title: "2",
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "test job2",
        salary: 80000,
        equity: null,
        companyHandle: "c2",
      },
    ]);
  });
  test("works: w/ all filters", async function () {
    let jobs = await Job.findAll({
      title: "test",
      minSalary: 100000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "test job",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c1",
      },
    ]);
  });
  test("works: w/ minSalary filter", async function () {
    let jobs = await Job.findAll({
      minSalary: 150000,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "cat wrangler",
        salary: 150000,
        equity: "0.75",
        companyHandle: "c3",
      },
    ]);
  });
  test("works: w/ hasEquity filter", async function () {
    let jobs = await Job.findAll({
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "cat wrangler",
        salary: 150000,
        equity: "0.75",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "test job",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c1",
      },
    ]);
  });
});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    const id = await getValidJobId();
    let job = await Job.get(id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "cat wrangler",
      salary: 150000,
      equity: "0.75",
      companyHandle: "c3",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** getByComp */

describe("getByComp", function () {
  test("works", async function () {
    let job = await Job.getByComp("c1");
    expect(job).toEqual([
      {
        id: expect.any(Number),
        title: "test job",
        salary: 100000,
        equity: "0.05",
      }
    ]);
  });

});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "dog catcher",
    salary: 50000,
    equity: 0.01,
  };
  test("works", async function () {
    const id = await getValidJobId();
    let job = await Job.update(id, updateData);
    job.equity = parseFloat(job.equity);
    expect(job).toEqual({
      id: id,
      companyHandle: "c3",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`
    );
    expect(result.rows).toEqual([
      {
        id: id,
        title: "dog catcher",
        salary: 50000,
        equity: "0.01",
        company_handle: "c3",
      },
    ]);
  });

  test("works: null fields", async function () {
    const id = await getValidJobId();
    const updateDataSetNulls = {
      title: "dog catcher",
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id: id,
      ...updateDataSetNulls, companyHandle: "c3",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`
    );
    expect(result.rows).toEqual([
      {
        id: id,
        title: "dog catcher",
        salary: null,
        equity: null,
        company_handle: "c3",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(999999, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const id = await getValidJobId();
    await Job.remove(id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
