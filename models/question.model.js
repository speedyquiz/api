const mongoose = require("mongoose");

const Question = mongoose.model(
  "Question",
  new mongoose.Schema(
    {
      questionNo: { type: String },
      question: { type: String, required: true },
      difficulty: { type: String },
      type: { type: String, default: "text" },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz-Category",
        required: true,
      },
      rightOption: { type: String, required: true },
      wrongOption1: { type: String, required: true },
      wrongOption2: { type: String, required: true },
      wrongOption3: { type: String, required: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = Question;
