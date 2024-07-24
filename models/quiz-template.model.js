const mongoose = require("mongoose");

const QuizTemplate = mongoose.model(
  "Quiz-Template",
  new mongoose.Schema(
    {
      title: { type: String, required: true },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz-Category",
        required: true,
      },
      description: { type: String, required: true },
      image: { type: String },
      userLimit: { type: String, required: true },
      price: { type: String, required: true },
      points: { type: Number, required: true },
      jackpotPercentage: { type: String, required: true },
      noOfQuestions: { type: String, required: true },
      timeInSeconds: { type: String, required: true },
      order: { type: Number },
      isActive: { type: Boolean, default: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = QuizTemplate;
