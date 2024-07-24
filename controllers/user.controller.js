const Joi = require("joi");
const db = require("../models");
const bcrypt = require("bcrypt");
const User = db.user;
const UserReward = db.userreward;
const UserBank = db.userbank;
const Point = db.point;
const Payout = db.payout;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.changePassword = (req, res) => {
  const userId = req.params.id;
  const data = req.body;
  const schema = Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findById(userId).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      const isPasswordMatch = bcrypt
        .compare(data.oldPassword, user.password)
        .then((isMatch) => {
          if (isMatch) {
            const password = data.newPassword;
            const salt = bcrypt.genSaltSync(8);
            user.password = bcrypt.hashSync(password, salt);
            user.save();

            res.status(200).send({
              message: "You have successfully changed your password.",
            });
          } else {
            return res.status(401).send({ message: "Incorrect old password" });
          }
        })
        .catch((error) => {
          console.error("An error occurred during password comparison:", error);
        });
    });
  }
};

exports.getProfile = (req, res) => {
  const id = req.params.id;
  const schema = Joi.object({
    id: Joi.string().required(),
  });

  const validationResult = schema.validate(req.params);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findById(id)
      .populate("roles", "-__v")
      .exec((err, user) => {
        if (err) {
          if (err.name == "CastError") {
            res
              .status(500)
              .send({ message: "Invalid userId Or User Not found." });
            return;
          } else {
            res.status(500).send({ message: err });
            return;
          }
        }

        if (!user) {
          return res.status(404).send({ message: "User Not found." });
        }

        res.status(200).send({
          message: "User.",
          data: user,
        });
      });
  }
};

exports.updateProfile = (req, res) => {
  const userId = req.params.id;
  const data = req.body;
  const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string(),
    phone: Joi.string(),
    dob: Joi.string(),
    city: Joi.string(),
    country: Joi.string(),
    device: Joi.string(),
    profileImage: Joi.string(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    // Email
    User.findOne({
      _id: { $ne: userId },
      isDeleted: { $ne: true },
      email: req.body.email,
    }).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (user) {
        res.status(400).send({ message: "Failed! Email is already in use!" });
        return;
      }
    });

    User.findById(userId).exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      try {
        var Points = user.points;

        user.name = data.name;
        user.email = data.email ?? user.email;
        user.phone = data.phone ?? user.phone;
        user.dob = data.dob ?? user.dob;
        user.city = data.city ?? user.city;
        user.country = data.country ?? user.country;
        user.device = data.device ?? user.device;

        const allPoints = await Point.find();
        const id = allPoints[0]._id;
        const point = await Point.findById(id);

        if (req.file) {
          if (!user.profileImage || user.profileImage == "") {
            Points = Points + point.profile_image;
            const userRewardData = {
              userId: user._id,
              type: "point",
              reward: point.profile_image,
              referenceId: "",
              message: "Points earned for update profile image.",
              isWithdraw: false,
            };
            this.userRewards(userRewardData);
          }
          const imagePath = req.file.path;
          var imageUrl = imagePath.replace(/\\/g, "/");
          imageUrl = imageUrl.replace("public/", "");
          user.profileImage = imageUrl;
        }

        setTimeout(() => {
          if (
            user.isProfilecompleted == false &&
            user.profileImage &&
            user.profileImage != "" &&
            user.city &&
            user.city != "" &&
            user.country &&
            user.country != ""
          ) {
            Points = Points + point.profile_completion;
            const userRewardData = {
              userId: user._id,
              type: "point",
              reward: point.profile_completion,
              referenceId: "",
              message: "Points earned for profile completion.",
              isWithdraw: false,
            };
            this.userRewards(userRewardData);
            user.isProfilecompleted = true;
          }

          user.points = Points;
          user.save();

          res.status(200).send({
            message: "Profile updated successfully.",
            data: user,
          });
        }, 2000);
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .send({ message: "An error occurred while updating the profile." });
      }
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default("createdAt"),
      order: Joi.string().default("desc"),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize, sortBy, order } = value;
    const skip = (page - 1) * pageSize;

    const users = await User.find({
      isDeleted: { $ne: true },
      roles: { $in: "64ad1875e16808d16e1a21f6" },
    })
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(pageSize)
      .exec();

    const totalCount = await User.countDocuments({
      isDeleted: { $ne: true },
      roles: { $in: "64ad1875e16808d16e1a21f6" },
    });

    // Calculate total pages based on pageSize
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: "User",
      data: users,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch Users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createMember = async (req, res) => {
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
      roles: "64ad1875e16808d16e1a21f6",
    });
    user.save((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      res.send({
        message: "Member created successfully!",
        data: user,
      });
    });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isDeleted: true });
    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Failed to delete member:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.searchMember = async (req, res) => {
  try {
    const paginationSchema = Joi.object({
      searchQuery: Joi.string().required(),
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize, searchQuery } = value;
    const skip = (page - 1) * pageSize;

    const regex = new RegExp(searchQuery, "i"); // Case-insensitive regex
    const members = await User.find({
      isDeleted: { $ne: true },
      roles: { $in: "64ad1875e16808d16e1a21f6" },
      $or: [{ name: regex }, { email: regex }],
    })
      .skip(skip)
      .limit(pageSize)
      .exec();
    if (members.length > 0) {
      const totalCount = await User.countDocuments({
        isDeleted: { $ne: true },
        roles: { $in: "64ad1875e16808d16e1a21f6" },
        $or: [{ name: regex }, { email: regex }],
      });

      // Calculate total pages based on pageSize
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({
        message: "Members.",
        data: members,
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: totalCount,
      });
    } else {
      return res.status(404).json({ message: "Member not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to search Member" });
  }
};

exports.getMyRewards = async (req, res) => {
  try {
    const userId = req.params.id;

    User.findById(userId).exec((err, user) => {
      if (err) {
        console.log(err);
      }
      const condition = { userId: user._id };
      UserReward.find(condition)
        .exec()
        .then((userRewards) => {
          const Data = {
            userName: user.name,
            totalPoints: user.points,
            totalCashPrice: user.cashPrice,
            rewardHistory: userRewards,
          };
          res.status(200).send({
            message: "User Rewards",
            data: Data,
          });
        });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.userRewards = async (req, res) => {
  if (req) {
    const reward = new UserReward({
      userId: req.userId,
      type: req.type,
      reward: req.reward,
      referenceId: req.referenceId,
      message: req.message,
      isWithdraw: req.isWithdraw,
    });
    reward.save((err, userreward) => {
      if (err) {
        console.log(err);
      }
      return;
    });
  }
  return;
};

exports.getBankDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    User.findById(userId).exec((err, user) => {
      if (err) {
        console.log(err);
      }
      const condition = { userId: user._id };
      UserBank.find(condition)
        .exec()
        .then((userBank) => {
          const Data = {
            userName: user.name,
            stripeId: user.stripeId,
            userBank: userBank,
          };
          res.status(200).send({
            message: "User Bank Details",
            data: Data,
          });
        });
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addStripeID = (req, res) => {
  const userId = req.params.id;
  const data = req.body;
  const schema = Joi.object({
    stripeId: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findById(userId).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      try {
        user.stripeId = data.stripeId;
        user.save();

        res.status(200).send({
          message: "StripeId Added successfully.",
          data: user,
        });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .send({ message: "An error occurred while adding the StripeId." });
      }
    });
  }
};

exports.addBankDetails = (req, res) => {
  const userId = req.params.id;
  const data = req.body;
  const schema = Joi.object({
    bankId: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findById(userId).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      try {
        const bank = new UserBank({
          userId: userId,
          bankId: data.bankId,
        });
        bank.save(async (err) => {
          if (err) {
            console.log(err);
          }
          setTimeout(() => {
            UserBank.countDocuments(
              { userId: userId },
              async (err, bankCount) => {
                if (bankCount == 1) {
                  const allPoints = await Point.find();
                  const id = allPoints[0]._id;
                  const point = await Point.findById(id);

                  var Points = user.points;

                  Points = Points + point.bank_account;
                  const userRewardData = {
                    userId: user._id,
                    type: "point",
                    reward: point.bank_account,
                    referenceId: "",
                    message: "Points earned for Adding Bank Account.",
                    isWithdraw: false,
                  };
                  this.userRewards(userRewardData);

                  user.points = Points;
                  user.save();
                }
              }
            );
          }, 1000);
          res.status(200).send({
            message: "Bank Added successfully.",
          });
        });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .send({ message: "An error occurred while adding the StripeId." });
      }
    });
  }
};

exports.addAdsPoints = async (req, res) => {
  const userId = req.params.id;
  try {
    User.findById(userId).exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      const allPoints = await Point.find();
      const id = allPoints[0]._id;
      const point = await Point.findById(id);

      var Points = user.points;

      Points = Points + point.watching_ads;
      const userRewardData = {
        userId: user._id,
        type: "point",
        reward: point.watching_ads,
        referenceId: "",
        message: "Points earned for watching Pre Quiz Ads.",
        isWithdraw: false,
      };
      this.userRewards(userRewardData);

      user.points = Points;
      user.save();

      res.status(200).send({
        message: "Pre Quiz Ads Points Added successfully.",
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "An error occurred while adding points." });
  }
};

exports.payoutPrice = (req, res) => {
  const userId = req.params.id;
  const data = req.body;
  const schema = Joi.object({
    amount: Joi.number().required(),
    transactionId: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    User.findById(userId).exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      try {
        var cashPrice = user.cashPrice;
        if (cashPrice >= data.amount) {
          const userRewardData = {
            userId: user._id,
            type: "price",
            reward: data.amount,
            referenceId: data.transactionId,
            message: "Price Withdraw to Bank Account.",
            isWithdraw: true,
          };
          this.userRewards(userRewardData);

          var Price = cashPrice - data.amount;
          user.cashPrice = Price;
          user.save();

          res.status(200).send({
            message: "Withdraw successfully.",
          });
        } else {
          res.status(500).send({ message: "Insufficient Amount for Payout." });
        }
      } catch (err) {
        console.log(err);
        res.status(500).send({ message: "An error occurred while Withdraw." });
      }
    });
  }
};
