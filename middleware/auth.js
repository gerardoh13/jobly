"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, ForbiddenError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be admin.
 *
 * If not, raises Forbiden.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user.isAdmin) throw new ForbiddenError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must admin or accessing own account.
 *
 * If not, raises Forbiden.
 */

function ensureAdminOrSelf(req, res, next) {
  try {
    const ownAcct = res.locals.user.username === req.params.username
    const adminAcct = res.locals.user.isAdmin
    if (ownAcct || adminAcct) {
      return next();
    } else throw new ForbiddenError();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrSelf
};
