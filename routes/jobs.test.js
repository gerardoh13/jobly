"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getValidJobId,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "developer",
    salary: 80000,
    equity: 0.05,
    companyHandle: "c1",
  };

  test("forbidden for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { id: expect.any(Number), ...newJob, equity: "0.05" },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "developer",
        salary: 80000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "80000",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
          companyHandle: "c3",
        },
      ],
    });
  });

  test("works: w/ title filter", async function () {
    const resp = await request(app).get("/jobs?title=cat");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "cat wrangler",
          salary: 150000,
          equity: "0.75",
          companyHandle: "c3",
        },
      ],
    });
  });
  test("works: w/ multiple filters", async function () {
    const resp = await request(app).get("/jobs?title=test&hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "test job",
          salary: 100000,
          equity: "0.05",
          companyHandle: "c1",
        },
      ],
    });
  });
  test("fails: inappropriate params", async function () {
    const resp = await request(app).get("/jobs?chungus=big");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: params w/ invalid type", async function () {
    const resp = await request(app).get("/jobs?minSalary=foo");
    expect(resp.statusCode).toEqual(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const id = await getValidJobId();
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "cat wrangler",
        salary: 150000,
        equity: "0.75",
        companyHandle: "c3",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/999999`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "dog catcher",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "dog catcher",
        salary: 150000,
        equity: "0.75",
        companyHandle: "c3",
      },
    });
  });

  test("unauth for anon", async function () {
    const id = await getValidJobId();
    const resp = await request(app).patch(`/jobs/${id}`).send({
      title: "dog catcher",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin users", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "dog catcher",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/999999`)
      .send({
        title: "dog catcher",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on companyHandle change attempt", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
    .patch(`/jobs/${id}`)
    .send({
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        salary: "NAN",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("unauth for anon", async function () {
    const id = await getValidJobId();
    const resp = await request(app).delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin users", async function () {
    const id = await getValidJobId();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/999999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
