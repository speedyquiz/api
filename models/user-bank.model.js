const mongoose = require("mongoose");

const UserBank = mongoose.model(
  "User-Bank",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      bankId: { type: String, required: true },
      status: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = UserBank;
