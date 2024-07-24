const mongoose = require("mongoose");
const quizController = require("../controllers/quiz.controller");

mongoose.set("strictQuery", false);
const connect = () => {
  mongoose
      .connect(
        // "mongodb://127.0.0.1:27017/SpeedQuiz",
      "mongodb://SpeedQuiz:SOh3ypJPxmt1fL@54.201.160.69:58173/SpeedQuiz",
      // "mongodb://SpeedQuiz:SOh3ypJPxmt1fL@54.153.246.189:27017/SpeedQuiz",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => {
      console.log("Connected to MongoDB");
      setInterval(() => {
        quizController.quizLoop();
      }, 1000);
    })
    .catch((error) => {
      console.error("Failed to connect to MongoDB:", error);
    });
};

module.exports = { connect };
