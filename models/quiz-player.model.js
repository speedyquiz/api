const mongoose = require("mongoose");

const QuizPlayer = mongoose.model(
  "Quiz-Player",
  new mongoose.Schema(
    {
      quizGameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz-Game",
        required: true,
      },
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      score: { type: String, required: true },
      time: { type: String },
      isSubmited: { type: Boolean, required: false },
      isWinner: { type: Boolean, required: true },
    },
    { timestamps: true }
  )
);

module.exports = QuizPlayer;
