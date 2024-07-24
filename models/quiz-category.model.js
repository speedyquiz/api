const mongoose = require("mongoose");

const QuizCategory = mongoose.model(
  "Quiz-Category",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = QuizCategory;
