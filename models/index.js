const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.set("strictQuery", false); // Set strictQuery to false

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
// db.api = require("./api-token.model");
db.quizcategory = require("./quiz-category.model");
db.quiztemplate = require("./quiz-template.model");
db.question = require("./question.model");
db.quiz = require("./quiz.model");
db.quizquestion = require("./quiz-question.model");
db.quizplayer = require("./quiz-player.model");
db.userreward = require("./user-reward.model");
db.faq = require("./faq.model");
db.cms = require("./cms.model");
db.userbank = require("./user-bank.model");
db.video = require("./video.model");
db.point = require("./point.model");
db.carousel = require("./carousel.model");

db.ROLES = ["admin", "user"];

module.exports = db;
