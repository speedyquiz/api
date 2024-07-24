const mongoose = require("mongoose");

const Point = mongoose.model(
  "Point",
  new mongoose.Schema(
    {
      signup: { type: Number, required: true, default: 10 },
      profile_image: { type: Number, required: true, default: 10 },
      bank_account: { type: Number, required: true, default: 10 },
      profile_completion: { type: Number, required: true, default: 10 },
      watching_ads: { type: Number, required: true, default: 3 },
      winning_quiz: { type: Number, required: true, default: 10 },
      correct_all_answers: { type: Number, required: true, default: 10 },
    },
    { timestamps: true }
  )
);

module.exports = Point;
