const mongoose = require("mongoose");

const UserReward = mongoose.model(
  "User-Reward",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: { type: String, required: true },
      reward: { type: String, required: true },
      referenceId: { type: String, default: "" },
      message: { type: String, required: true },
      isWithdraw: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = UserReward;
