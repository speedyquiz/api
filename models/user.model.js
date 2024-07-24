const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      username: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      password: { type: String, required: true },
      dob: { type: Date },
      profileImage: { type: String },
      points: { type: Number, default: 0 },
      cashPrice: { type: Number, default: 0 },
      city: { type: String },
      country: { type: String },
      device: { type: String },
      resetToken: { type: String },
      stripeId: { type: String },
      roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
        },
      ],
      accessToken: { type: String },
      isProfilecompleted: { type: Boolean, default: false },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = User;
