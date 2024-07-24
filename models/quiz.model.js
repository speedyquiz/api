const mongoose = require("mongoose");

const QuizGames = mongoose.model(
  "Quiz-Game",
  new mongoose.Schema(
    {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz-Template",
        required: true,
      },
      quizTitle: { type: String, required: true },
      image: { type: String },
      dateTime: { type: String, required: true },
      order: { type: Number, required: true },
      winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      highestScore: { type: String },
      lowestTime: { type: String },
      price: { type: String },
      points: { type: Number },
      jackpotPercentage: { type: String },
      noOfQuestions: { type: String },
      timeInSeconds: { type: String },
      templateOrder: { type: Number, default: 1 },
      jackpotPrice: { type: Number, default: 0 },
      isLive: { type: Boolean, default: false },
      resultEmited: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = QuizGames;
