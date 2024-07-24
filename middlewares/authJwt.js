const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;
const ApiToken = db.api;

verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  if (global.tokenBlacklist.has(token)) {
    return res
      .status(401)
      .json({ message: "Login token has expired. Please re-login" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    } /*else {
      User.findOne({
        accessToken: req.headers["x-access-token"],
      }).exec((err, user) => {
        if (err) {
          return res.status(401).send({
            message: "Unauthorized!",
          });
        }
        if (!user) {
          return res
            .status(401)
            .send({ message: "Login token has expired. Please re-login" });
        }
      });
    }*/

    req.userId = decoded.id;
    next();
  });
};

isAdmin = (req, res, next) => {
  User.findById(req.userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    Role.find(
      {
        _id: { $in: user.roles },
      },
      (err, roles) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        for (let i = 0; i < roles.length; i++) {
          if (roles[i].name === "admin") {
            next();
            return;
          }
        }

        res.status(403).send({ message: "Require Admin Role!" });
        return;
      }
    );
  });
};

const authJwt = {
  verifyToken,
  isAdmin,
};
module.exports = authJwt;
