const { authJwt } = require("../middlewares");
const quizCategoryController = require("../controllers/quiz-category.controller");
const quizTempaleController = require("../controllers/quiz-template.controller");
const quizController = require("../controllers/quiz.controller");

const fs = require("fs");

const multer = require("multer");
const path = require("path");

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "public/uploads/templateImage"; // Set your destination folder here

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // cb(null, Date.now() + "-" + file.originalname); // Add a timestamp to the filename
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/quiz-category",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.createQuizCategory
  );
  app.get(
    "/quiz-category",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.getQuizCategories
  );
  app.get(
    "/quiz-category/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.getQuizCategoryById
  );
  app.put(
    "/quiz-category/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.updateQuizCategory
  );
  app.delete(
    "/quiz-category/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.deleteQuizCategory
  );
  app.get(
    "/search-quiz-category",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizCategoryController.searchQuizCategories
  );

  app.get(
    "/quiz-template",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.getQuizzTemplates
  );
  app.get(
    "/quiz-all-template",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.getAllQuizzTemplates
  );
  app.get(
    "/quiz-template/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.getQuizTemplateById
  );
  app.post(
    "/quiz-template",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("image"),
    quizTempaleController.createQuizTemplate
  );
  app.put(
    "/quiz-template/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("image"),
    quizTempaleController.updateQuizTemplate
  );
  app.put(
    "/reorder/quiz-template",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.updateOrderOfTemplate
  );
  app.delete(
    "/quiz-template/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.deleteQuizTemplate
  );
  app.put(
    "/active-deactive-template/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizTempaleController.activeDeactiveQuizTemplate
  );

  app.get("/quiz-game", quizController.createQuizGame);
  app.get("/dashboard-quiz-game", quizController.getQuizGame);
  app.get("/quiz/:id", [authJwt.verifyToken], quizController.getQuizById);
  app.get(
    "/get-quiz-question/:id",
    [authJwt.verifyToken],
    quizController.getQuizQuestion
  );
  app.post(
    "/join-quiz-game",
    [authJwt.verifyToken],
    quizController.joinQuizGame
  );
  app.post(
    "/submit-quiz-game",
    [authJwt.verifyToken],
    quizController.submitQuizGame
  );
  app.get(
    "/quiz-leaderboard/:id",
    [authJwt.verifyToken],
    quizController.getQuizLeaderBoard
  );

  app.get(
    "/quiz-winner-list",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.getQuizWinner
  );
  
  app.get(
    "/quiz-winner-list/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.getQuizWinner
  );

  app.get("/past-quiz/:id", [authJwt.verifyToken], quizController.getPastQuiz);

  app.delete("/delete-extra-quiz", quizController.deleteExtraQuiz);

  app.get(
    "/quiz-list",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.getQuizList
  );

  app.get(
    "/quiz-list/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.getQuizList
  );

  app.get("/test", quizController.testData);

  app.get(
    "/dashboard-statistical-count",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.getStatisticalCount
  );

  app.get(
    "/track-payout",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.TrackPayout
  );
  app.get(
    "/track-payout/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    quizController.TrackPayout
  );
};
