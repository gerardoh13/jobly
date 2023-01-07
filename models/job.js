"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, searchFilter } = require("../helpers/sql");
const { commonAfterAll } = require("./_testCommon");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const handleCheck = await db.query(`
      SELECT handle
             FROM companies
             WHERE handle = $1`,
             [companyHandle])
      const handle = handleCheck.rows[0]
      if (!handle) throw new NotFoundError(`No company: ${companyHandle}`);

    const duplicateCheck = await db.query(
      `SELECT id
           FROM jobs
           WHERE title=$1 AND salary=$2 AND equity=$3 AND company_handle=$4`,
      [title, salary, equity, companyHandle]
    );

    if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate job`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   * if passed query params will filter results. valid params = title, minSalary, hasEquity
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(data) {
    const { cols, values } = searchFilter(data);
    let where = cols ? "WHERE" : "";

    const querySql = `SELECT id,
                              title,
                              salary,
                              equity,
                              company_handle AS "companyHandle"
                     FROM jobs
                     ${where} ${cols}
                     ORDER BY title`;
    const jobRes = await db.query(querySql, values);
    return jobRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


    /** Given a company handle, return jobs for that company.
   *
   * Returns [{ id, title, salary, equity },...]
   *
   **/

    static async getByComp(handle) {
      const jobsRes = await db.query(
        `SELECT id,
                title,
                salary,
                equity
          FROM jobs
          WHERE company_handle = $1`,
        [handle]
      );
      
      return jobsRes.rows;
    }
  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
