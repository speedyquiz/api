const config = require("../config/auth.config");
const Joi = require("joi");
const db = require("../models");
const User = db.user;
const Role = db.role;
const Point = db.point;
// const ApiToken = db.api;
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const UserController = require("./user.controller");

var jwt = require("jsonwebtoken");

// const bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    password: Joi.string().required(),
    phone: Joi.string(),
    dob: Joi.string(),
    city: Joi.string(),
    country: Joi.string(),
    device: Joi.string(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    const password = data.password;
    // Generate a salt
    const salt = bcrypt.genSaltSync(8);
    const user = new User({
      username: data.username,
      email: data.email,
      name: data.name,
      password: bcrypt.hashSync(password, salt),
      phone: data.phone,
      dob: data.dob,
      city: data.city,
      country: data.country,
      device: data.device,
      points: 10,
    });
    user.save(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      const allPoints = await Point.find();
      const id = allPoints[0]._id;
      const point = await Point.findById(id);

      const userRewardData = {
        userId: user._id,
        type: "point",
        reward: point.signup,
        referenceId: "",
        message: "Points earned for signup in SPEEDQUIZZ.",
        isWithdraw: false,
      };
      UserController.userRewards(userRewardData);

      const token = jwt.sign({ id: user.id }, config.secret, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: "365d", // 365 days
        // expiresIn: 86400, // 24 hours
      });

      if (req.body.roles) {
        Role.find(
          {
            name: { $in: req.body.roles },
          },
          (err, roles) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }
            user.accessToken = token;
            user.roles = roles.map((role) => role._id);
            user.save((err) => {
              if (err) {
                res.status(500).send({ message: err });
                return;
              }

              res.send({
                message: "User was registered successfully!",
                data: user,
              });
            });
          }
        );
      } else {
        Role.findOne({ name: "user" }, (err, role) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
          user.accessToken = token;
          user.roles = [role._id];
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({
              message: "User was registered successfully!",
              data: user,
            });
          });
        });
      }
    });
  }
};

exports.signin = (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findOne({
      isDeleted: { $ne: true },
      $or: [{ email: req.body.email }, { username: req.body.email }],
    })
      .populate("roles", "-__v")
      .exec((err, user) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }

        var passwordIsValid = bcrypt.compareSync(
          req.body.password,
          user.password
        );

        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "Invalid Password!",
          });
        }
        global.tokenBlacklist.add(user.accessToken);
        const token = jwt.sign({ id: user.id }, config.secret, {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: "365d", // 365 days
          // expiresIn: 86400, // 24 hours
        });

        user.accessToken = token;
        user.save((err, user) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }
        });

        // var authorities = [];

        // for (let i = 0; i < user.roles.length; i++) {
        //   authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        // }
        res.status(200).send({
          message: "User logged in successfully!",
          data: user,
        });
      });
  }
};

exports.logout = (req, res) => {
  const userId = req.params.id;
  const token = req.headers["x-access-token"];
  // ApiToken.deleteOne({ token: req.headers["x-access-token"] });
  User.findById(userId).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    user.accessToken = "";
    user.save();
    global.tokenBlacklist.add(token);

    res.status(200).send({
      message: "User logged out successfully!",
    });
  });
  return;
};

exports.forgotPassword = (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const resetToken = Math.random().toString(36).slice(2);
      user.resetToken = resetToken;
      user.save();

      sendPasswordResetEmail(user, resetToken);
      res.status(200).send({
        message:
          "An email with instructions for creating a new password has been sent to you.",
      });
    });
  }
};

exports.resetPassword = (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    email: Joi.string().email().required(),
    token: Joi.string().required(),
    newPassword: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findOne({
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      if (user.resetToken !== data.token) {
        return res.status(401).send({ message: "Invalid or expired token" });
      }

      const password = data.newPassword;
      const salt = bcrypt.genSaltSync(8);
      user.resetToken = "";
      user.password = bcrypt.hashSync(password, salt);
      user.save();

      res.status(200).send({
        message: "You have successfully reset your password.",
      });
    });
  }
};

// Function to send the password reset email
function sendPasswordResetEmail(user, resetToken) {
  // Replace the following email setup with your actual email configuration (e.g., SMTP, service, etc.)
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "",
      pass: "",
    },
  });

  const mailOptions = {
    from: "Speed Quiz",
    to: user.email,
    subject: "Create a new password on Speed Quiz",
    html: `<h2>Create a new password</h2><p>Forgot your password, huh? No big deal.<br/>
    To create a new password, just follow this link:</p><br/>
          <a href="http://localhost:9205/auth/reset-password?email=${user.email}&token=${resetToken}">Reset Password</a><br/>
          <p>You received this email, because it was requested by a Speed Quiz user. This is part of the procedure to create a new password on the system. If you DID NOT request a new password then please ignore this email and your password will remain the same.</p><br/>
Thank you,<br />
The Speed Quiz Team
`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
