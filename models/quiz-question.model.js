const mongoose = require("mongoose");

const QuizQuestion = mongoose.model(
  "Quiz-Question",
  new mongoose.Schema(
    {
      quizGameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz-Game",
        required: true,
      },
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = QuizQuestion;
