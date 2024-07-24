const db = require("../models");
const moment = require("moment");
const Joi = require("joi");
const Quiz = db.quiz;
const QuizTemplate = db.quiztemplate;
const Question = db.question;
const QuizCategory = db.quizcategory;
const QuizQuestion = db.quizquestion;
const QuizPlayer = db.quizplayer;
const User = db.user;
const Point = db.point;
const mongoose = require("mongoose");

const UserController = require("./user.controller");
const QuizGames = require("../models/quiz.model");

const players = {};

const createQuizGame_old = async (req, res) => {
  try {
    Quiz.updateMany(
      { isLive: true }, // Match documents where isLive is true
      { $set: { isLive: false } }, // Set isLive to false
      function (err, result) {
        if (err) {
          console.error(err);
        } else {
          console.log(`${result.modifiedCount} document(s) updated`);
        }
      }
    );
    var Order = 4;
    const condition = { order: { $gte: 1, $lte: 4 } };
    Quiz.find(condition)
      .sort("order")
      .exec()
      .then((quizGames) => {
        var excludedTemplate = [];
        if (quizGames.length == 4) {
          quizGames.forEach((Games, index) => {
            excludedTemplate.push(Games.quizTitle);
            const newOrder = index;
            if (newOrder == 0) {
              Games.isLive = true;
            }
            Games.order = newOrder;
            Games.save();
          });
        } else if (quizGames.length < 4 && quizGames.length > 0) {
          Order = quizGames.length + 1;
        } else if (quizGames.length == 0) {
          Order = 1;
        }

        QuizTemplate.countDocuments(
          { isDeleted: { $ne: true } },
          (err, templateCount) => {
            if (templateCount < 4) {
              excludedTemplate = [];
            }
          }
        );

        setTimeout(() => {
          QuizTemplate.aggregate([
            {
              $match: {
                // isActive: true,
                isDeleted: { $ne: true },
                title: { $not: { $in: excludedTemplate } },
              },
            },

            { $sample: { size: 1 } }, // Random sampling
            // QuizTemplate.findOne({
            //   $and: [
            //     { isDeleted: { $ne: true } },
            //     { isActive: true },
            //     { title: { $not: { $in: excludedTemplate } } },
            //   ],
          ]).exec((err, quizTemplate) => {
            console.log(quizTemplate);
            quizTemplate = quizTemplate[0];
            // var Min = Order * 5;
            const currentDateTIme = moment()
              // .add(21, "minutes")
              // .add(13, "minutes")
              .add(9, "minutes")
              .format("YYYY-MM-DD hh:mm A");

            const quiz = new Quiz({
              templateId: quizTemplate._id,
              quizTitle: quizTemplate.title,
              image: quizTemplate.image,
              dateTime: currentDateTIme,
              price: quizTemplate.price,
              points: quizTemplate.points,
              jackpotPercentage: quizTemplate.jackpotPercentage,
              noOfQuestions: quizTemplate.noOfQuestions,
              timeInSeconds: quizTemplate.timeInSeconds,
              order: Order,
            });
            // res.json({
            //   message: "Quiz created successfully.",
            //   quizGames: quizGames,
            //   data: quiz,
            // });
            // return;
            quiz.save((err, quiz) => {
              if (err) {
                res.status(500).send({ message: err });
                return;
              } else {
                Question.aggregate([
                  {
                    $match: {
                      isDeleted: { $ne: true },
                      category: quizTemplate.category,
                    },
                  },
                  { $sample: { size: Number(quizTemplate.noOfQuestions) } },
                ]).then((question) => {
                  var quizQuestionToInsert = [];
                  question.forEach((q) => {
                    quizQuestionToInsert.push({
                      quizGameId: quiz._id,
                      questionId: q._id,
                    });
                  });
                  QuizQuestion.insertMany(quizQuestionToInsert).then(
                    (savedQuestion) => {
                      return true;
                    }
                  );
                });
              }
            });
          });
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
        // Handle errors here
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to create quiz" });
  }
};

const createQuizGame = async (req, res) => {
  try {
    Quiz.updateMany(
      { isLive: true }, // Match documents where isLive is true
      { $set: { isLive: false } }, // Set isLive to false
      function (err, result) {
        if (err) {
          console.error(err);
        } else {
          console.log(`${result.modifiedCount} document(s) updated`);
        }
      }
    );
    var Order = 4;
    var templateOrder = 1;
    const condition = { order: { $gte: 1, $lte: 4 } };
    Quiz.find(condition)
      .sort("order")
      .exec()
      .then((quizGames) => {
        if (quizGames.length == 4) {
          quizGames.forEach((Games, index) => {
            const newOrder = index;
            if (newOrder == 0) {
              Games.isLive = true;
            }
            Games.order = newOrder;
            templateOrder = Games.templateOrder;
            Games.save();
          });
        } else if (quizGames.length < 4 && quizGames.length > 0) {
          quizGames.forEach((Games, index) => {
            const newOrder = index;
            if (newOrder == 0) {
              Games.isLive = true;
            }
            Games.order = newOrder;
            Games.save();
          });
          Order = quizGames.length + 1;
          templateOrder = quizGames.length + 1;
        } else if (quizGames.length == 0) {
          Order = 1;
        }

        QuizTemplate.findOne()
          .sort({ order: -1 })
          .exec((err, result) => {
            var max = result?.order ?? 0;
            var data = {
              templateOrder: templateOrder + 1,
              max: max,
            };
            if (data.templateOrder > max) {
              var data = {
                templateOrder: 1,
                max: max,
              };
            }
            getTemplateOrder(data, function (newTemp) {
              QuizTemplate.findOne({
                $and: [
                  { isDeleted: { $ne: true } },
                  { isActive: true },
                  { order: newTemp },
                  // { $or: [{ order: newTemp }, { order: 1 }] },
                ],
              }).exec((err, quizTemplate) => {
                // var Min = Order * 5;
                const currentDateTIme = moment()
                  // .add(21, "minutes")
                  // .add(13, "minutes")
                  .add(9, "minutes")
                  .format("YYYY-MM-DD hh:mm A");

                const quiz = new Quiz({
                  templateId: quizTemplate._id,
                  quizTitle: quizTemplate.title,
                  image: quizTemplate.image ?? "",
                  dateTime: currentDateTIme,
                  price: quizTemplate.price,
                  points: quizTemplate.points,
                  jackpotPercentage: quizTemplate.jackpotPercentage,
                  noOfQuestions: quizTemplate.noOfQuestions,
                  timeInSeconds: quizTemplate.timeInSeconds,
                  templateOrder: quizTemplate.order,
                  order: Order,
                });
                // res.json({
                //   message: "Quiz created successfully.",
                //   quizGames: quizGames,
                //   data: quiz,
                // });
                // return;
                quiz.save((err, quiz) => {
                  if (err) {
                    res.status(500).send({ message: err });
                    return;
                  } else {
                    Question.aggregate([
                      {
                        $match: {
                          isDeleted: { $ne: true },
                          category: quizTemplate.category,
                        },
                      },
                      { $sample: { size: Number(quizTemplate.noOfQuestions) } },
                    ]).then((question) => {
                      var quizQuestionToInsert = [];
                      question.forEach((q) => {
                        quizQuestionToInsert.push({
                          quizGameId: quiz._id,
                          questionId: q._id,
                        });
                      });
                      QuizQuestion.insertMany(quizQuestionToInsert).then(
                        (savedQuestion) => {
                          // res.json({
                          //   message: "Quiz created successfully.",
                          //   data: quiz,
                          //   question: savedQuestion,
                          // });
                          return true;
                        }
                      );
                    });
                  }
                });
              });
            });
          });
      })
      .catch((error) => {
        console.error(error);
        // Handle errors here
      });
  } catch (error) {
    res.status(500).json({ message: "Failed to create quiz" });
  }
};

function getTemplateOrder(data, callback) {
  var templateOrder = data.templateOrder;
  var max = data.max;
  QuizTemplate.findOne({
    $and: [
      { isDeleted: { $ne: true } },
      { isActive: true },
      { order: templateOrder },
    ],
  }).exec((err, quizTemplate) => {
    if (quizTemplate) {
      return callback(quizTemplate.order);
    } else {
      if (templateOrder + 1 <= max) {
        temp = {
          templateOrder: data.templateOrder + 1,
          max: data.max,
        };
        getTemplateOrder(temp, function (newTemp) {
          return callback(newTemp);
        });
      } else {
        temp = {
          templateOrder: 1,
          max: data.max,
        };
        return getTemplateOrder(temp, function (newTemp) {
          return callback(newTemp);
        });
      }
    }
  });
}

const getQuizGame = async (req, res) => {
  try {
    Quiz.aggregate([
      {
        $match: { order: { $gte: 1, $lte: 4 } },
      },
      {
        $lookup: {
          from: "quiz-templates",
          localField: "templateId",
          foreignField: "_id",
          as: "templateDetails",
        },
      },
      {
        $unwind: "$templateDetails",
      },
      {
        $lookup: {
          from: "quiz-categories",
          localField: "templateDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      // {
      //   $lookup: {
      //     from: "quiz-questions",
      //     localField: "_id",
      //     foreignField: "quizGameId",
      //     as: "questionDetails",
      //   },
      // },
    ]).exec(async (err, quizGames) => {
      var QuizData = [];
      quizGames.forEach(async (quiz) => {
        // const QuestionInfoPromises = [];
        // quiz.questionDetails.forEach((question) => {
        //   const questionPromise = fetchQuestionDetails(question.questionId);
        //   QuestionInfoPromises.push(questionPromise);
        // });
        try {
          // const QuestionInfo = await Promise.all(QuestionInfoPromises);
          var TempQuizData = {
            _id: quiz._id,
            templateId: quiz.templateId,
            quizTitle: quiz.quizTitle,
            image: quiz.image,
            dateTime: quiz.dateTime,
            categoryId: quiz.templateDetails.category,
            category: quiz.categoryDetails.name,
            description: quiz.templateDetails.description,
            userLimit: quiz.templateDetails.userLimit,
            price: quiz.price,
            points: quiz.points,
            jackpotPercentage: quiz.jackpotPercentage,
            timeInSeconds: quiz.timeInSeconds,
            noOfQuestions: quiz.noOfQuestions,
            jackpotPrice: quiz.jackpotPrice ?? 0,
            // questions: shuffleArray(QuestionInfo),
            templateOrder: quiz.templateOrder,
            order: quiz.order,
          };
          QuizData.push(TempQuizData);
        } catch (error) {
          console.error("Error processing quiz data:", error);
        }
      });
      // setTimeout(() => {
      const sortedQuizzes = QuizData.sort(
        (quizA, quizB) => quizA.order - quizB.order
      );

      res.json({
        message: "Quiz Games.",
        data: sortedQuizzes,
      });
      // }, 5000);
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Quiz not found" });
  }
};
const getQuizById = async (req, res) => {
  const { id } = req.params;
  const quizID = id;
  try {
    const quizGame = await Quiz.findById(quizID);
    var quizPlayers = [];
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    });
    const { error, value } = paginationSchema.validate(req.query);
    const { page, pageSize } = value;
    const skip = (page - 1) * pageSize;

    const val = req.query;

    // const quizTemplate = await QuizTemplate.findById(quizGame.templateId);

    if (isEmpty(val)) {
      quizPlayers = await QuizPlayer.find({ quizGameId: quizID });
    } else {
      quizPlayers = await QuizPlayer.find({ quizGameId: quizID })
        .skip(skip)
        .limit(pageSize)
        .exec();
    }

    var noWinner = true;
    var jackpotPrice = 0;
    const condition = {
      quizGameId: quizID,
      isWinner: true,
    };
    QuizPlayer.countDocuments(condition, (err, winner) => {
      if (winner > 0) {
        noWinner = false;
      } else {
        jackpotPrice =
          (parseFloat(quizGame.jackpotPercentage) / 100) *
          parseFloat(quizGame.price);
      }
    });

    var Players = [];
    quizPlayers.forEach(async (player) => {
      var p = await User.findById(player.playerId);
      PlayersData = {
        id: player._id,
        playerId: player.playerId,
        playerName: p.name,
        playerScore: player.score,
        totalScore: quizGame.noOfQuestions,
        playerTime: player.time,
        isWinner: player.isWinner,
        city: p.city,
        country: p.country,
      };
      Players.push(PlayersData);
    });
    setTimeout(async () => {
      const player = Players;

      player.sort((playerA, playerB) => {
        if (playerA.playerScore !== playerB.playerScore) {
          return playerB.playerScore - playerA.playerScore; // Sort by score in descending order
        } else {
          const [secondsA, millisecondsA] = playerA.playerTime.split(":");
          const [secondsB, millisecondsB] = playerB.playerTime.split(":");

          const totalMillisecondsA =
            parseInt(secondsA) * 1000 + parseInt(millisecondsA);
          const totalMillisecondsB =
            parseInt(secondsB) * 1000 + parseInt(millisecondsB);

          return totalMillisecondsA - totalMillisecondsB; // Sort by time in ascending order
        }
      });
      // res.status(200).json({ message: "Quiz Players", data: player });
      quizData = {
        quizGameId: quizID,
        quizTitle: quizGame.quizTitle,
        image: quizGame.image,
        quizPrice: quizGame.price,
        userLimit: quizGame.userLimit,
        price: quizGame.price,
        points: quizGame.points,
        jackpotPercentage: quizGame.jackpotPercentage,
        timeInSeconds: quizGame.timeInSeconds,
        noOfQuestions: quizGame.noOfQuestions,
      };

      // Get the total count of questions (for pagination)
      const totalCount = await QuizPlayer.countDocuments({
        quizGameId: quizID,
      });

      // Calculate total pages based on pageSize
      const totalPages = Math.ceil(totalCount / pageSize);

      resultData = {
        quizData: quizData,
        player: player,
        noWinner: noWinner,
        jackpotPrice: jackpotPrice,
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: totalCount,
      };
      res.status(200).json({ message: "Quiz", data: resultData });
    }, 1000);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const quizQuestion = await QuizQuestion.find({ quizGameId: id });
    if (quizQuestion.length == 0) {
      return res.status(404).json({ message: "Quiz Question not found" });
    }
    const QuestionInfoPromises = [];
    quizQuestion.forEach(async (question) => {
      const questionPromise = fetchQuestionDetails(question.questionId);
      QuestionInfoPromises.push(questionPromise);
    });
    const QuestionInfo = await Promise.all(QuestionInfoPromises);

    res.json({
      message: "Quiz Questions",
      data: shuffleArray(QuestionInfo),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

async function fetchQuestionDetails(questionId) {
  return new Promise((resolve, reject) => {
    Question.findById(questionId).exec((error, result) => {
      if (error) {
        console.error("Error selecting columns:", error);
        reject(error);
      } else {
        const shuffledOptions = shuffleArray(
          [
            result.rightOption,
            result.wrongOption1,
            result.wrongOption2,
            result.wrongOption3,
          ],
          "obj"
        );
        var Temp = {
          _id: result._id,
          question: result.question,
          type: result.type ? result.type.toLowerCase() : "text",
          rightOption: result.rightOption,
          option: shuffledOptions,
        };
        // QuestionInfo.push(Temp);
        resolve(Temp);
      }
    });
  });
}

// Function to shuffle an array
function shuffleArray(array, type = "array") {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  if (type == "obj") {
    const convertedObject = array.reduce((obj, item, index) => {
      obj[`option${index + 1}`] = item;
      return obj;
    }, {});
    return convertedObject;
  } else {
    return array;
  }
}

const quizLoop = async (req, res) => {
  const currentTime = new Date();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();

  // if (isDesiredTime(currentMinutes, currentSeconds, 3)) {
  if (isDesiredTime(currentMinutes, currentSeconds, 2)) {
    console.log("Current time is a desired time.");
    await createQuizGame(req, res);
  }
  if (isDesiredTime(currentMinutes, currentSeconds, 1)) {
    console.log("Current time is a desired time for live.");
    await liveGame(req, res);
  } else {
    // console.log("Current time is not a desired time.");
  }
};

function isDesiredTime(minutes, seconds, min) {
  if (min == 5) {
    //******  Every 5 Min
    var desiredMinutes = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59];
    var desiredSeconds = [55]; // Set your desired seconds value
  } else if (min == 3) {
    //******  Every 3 Min
    var desiredMinutes = [
      2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56,
      59,
    ];
    var desiredSeconds = [55]; // Set your desired seconds value
  } else if (min == 2) {
    //******  Every 2 Min
    var desiredMinutes = [
      1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39,
      41, 43, 45, 47, 49, 51, 53, 55, 57, 59,
    ];
    var desiredSeconds = [55]; // Set your desired seconds value
  } else {
    //******  Every Min
    var desiredMinutes = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
      58, 59, 60,
    ];
    var desiredSeconds = [0, 30]; // Set your desired seconds value
  }

  // return desiredMinutes.includes(minutes) && seconds === desiredSeconds;
  return desiredMinutes.includes(minutes) && desiredSeconds.includes(seconds);
}

const joinQuizGame = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    quizGameId: Joi.string().required(),
    playerId: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      QuizPlayer.countDocuments(
        { quizGameId: data.quizGameId, playerId: data.playerId },
        async (err, Player) => {
          if (Player > 0) {
            res.status(201).json({ message: "Quiz Join successfully" });
          } else {
            Quiz.findOne({
              _id: data.quizGameId,
            }).exec((err, Q) => {
              QuizTemplate.findOne({
                _id: Q.templateId,
              }).exec((err, QT) => {
                QuizPlayer.countDocuments(
                  { quizGameId: data.quizGameId },
                  async (err, CountPlayer) => {
                    if (CountPlayer >= QT.userLimit) {
                      res
                        .status(400)
                        .json({ message: "User Limit Reached for this Quiz." });
                    } else {
                      const quiz = new QuizPlayer({
                        quizGameId: data.quizGameId,
                        playerId: data.playerId,
                        score: 0,
                        time: "00:00",
                        isWinner: false,
                      });
                      await quiz.save();
                      const quizRoom = `quiz_room_${data.quizGameId}`;
                      global.io.to(quizRoom).emit("user-join", {
                        message: `New User Joined. - ${data.playerId}`,
                      });

                      res.status(201).json({
                        message: "Quiz Join successfully",
                      });
                    }
                  }
                );
              });
            });
          }
        }
      );
    } catch (error) {
      console.error("Failed to join Quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const submitQuizGame = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    quizGameId: Joi.string().required(),
    playerId: Joi.string().required(),
    score: Joi.string().required(),
    time: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const quizGame = await Quiz.findById(data.quizGameId);
      // const quizTemplate = await QuizTemplate.findById(quizGame.templateId);
      // Define the initial date
      const GameDateTime = new Date(quizGame.dateTime);
      GameDateTime.setSeconds(
        GameDateTime.getSeconds() + parseInt(quizGame.timeInSeconds)
      );

      var isWinner = false;
      if (!quizGame.highestScore) {
        quizGame.highestScore = data.score;
        quizGame.lowestTime = data.time;
        if (quizGame.noOfQuestions == data.score) {
          quizGame.winnerId = data.playerId;
          isWinner = true;
        }
      } else {
        if (parseInt(quizGame.highestScore) < parseInt(data.score)) {
          quizGame.highestScore = data.score;
          quizGame.lowestTime = data.time;
          if (quizGame.noOfQuestions == data.score) {
            quizGame.winnerId = data.playerId;
            isWinner = true;
          }
        } else if (quizGame.highestScore == data.score) {
          var Time = compareTimeInMilliSec(quizGame.lowestTime, data.time);
          if (Time == "1") {
            quizGame.lowestTime = data.time;
            if (quizGame.noOfQuestions == data.score) {
              quizGame.winnerId = data.playerId;
              isWinner = true;

              const updateQuery = { quizGameId: data.quizGameId };
              const updateOperation = {
                $set: {
                  isWinner: false,
                },
              };
              QuizPlayer.updateMany(updateQuery, updateOperation).then(
                (result) => {}
              );
            }
          }
        }
      }
      await quizGame.save();

      const conditions = {
        quizGameId: data.quizGameId,
        playerId: data.playerId,
      };

      const quizPlayer = await QuizPlayer.findOne(conditions);
      quizPlayer.quizGameId = data.quizGameId;
      quizPlayer.playerId = data.playerId;
      quizPlayer.score = data.score;
      quizPlayer.time = data.time;
      quizPlayer.isSubmited = true;
      quizPlayer.isWinner = isWinner;
      await quizPlayer.save();
      User.findById(data.playerId).exec((err, user) => {
        var Points = user.points;
        var cashPrice = user.cashPrice;
        Points = parseInt(Points) + parseInt(quizGame.points);
        const userRewardData = {
          userId: data.playerId,
          type: "point",
          reward: quizGame.points,
          referenceId: data.quizGameId,
          message:
            "Points earned for playing Quiz Game (" + quizGame.quizTitle + ").",
          isWithdraw: false,
        };
        UserController.userRewards(userRewardData);
        // if (isWinner) {
        //   Points = Points + 10;
        //   const userRewardData = {
        //     userId: data.playerId,
        //     type: "point",
        //     reward: 10,
        //     referenceId: data.quizGameId,
        //     message:
        //       "Points earned for winning Quiz Game (" +
        //       quizGame.quizTitle +
        //       ").",
        //     isWithdraw: false,
        //   };
        //   UserController.userRewards(userRewardData);

        //   cashPrice = parseInt(cashPrice) + parseInt(quizGame.price);
        //   if (quizGame.jackpotPrice && quizGame.jackpotPrice != 0) {
        //     cashPrice = parseInt(cashPrice) + parseInt(quizGame.jackpotPrice);
        //   }

        //   const userRewardData1 = {
        //     userId: data.playerId,
        //     type: "price",
        //     reward: cashPrice,
        //     referenceId: data.quizGameId,
        //     message:
        //       "Price Payout for winning Quiz Game (" +
        //       quizGame.quizTitle +
        //       ").",
        //     isWithdraw: false,
        //   };
        //   UserController.userRewards(userRewardData1);
        // } else if (quizGame.noOfQuestions == data.score) {
        //   Points = Points + 10;
        //   const userRewardData2 = {
        //     userId: data.playerId,
        //     type: "point",
        //     reward: 10,
        //     referenceId: data.quizGameId,
        //     message: "Points earned for correct all answers 100% of questions.",
        //     isWithdraw: false,
        //   };
        //   UserController.userRewards(userRewardData2);
        // }

        user.points = parseInt(Points);
        user.cashPrice = cashPrice;
        user.save();
      });

      // QuizPlayer.countDocuments(
      //   { quizGameId: data.quizGameId },
      //   async (err, totalPlayer) => {
      //     setTimeout(() => {
      //       const condition = {
      //         quizGameId: data.quizGameId,
      //         score: { $ne: 0 },
      //       };
      //       QuizPlayer.countDocuments(condition, (err, submitedQuiz) => {
      //         const currentDateTime = new Date();
      //         if (totalPlayer == submitedQuiz) {
      //           setTimeout(() => {
      //             emitQuizResult(data.quizGameId);
      //           }, 1000);
      //         } else if (currentDateTime > GameDateTime) {
      //           setTimeout(() => {
      //             //emitQuizResult(data.quizGameId);
      //           }, 5000);
      //         }
      //       });
      //     }, 3000);
      //   }
      // );

      res.status(201).json({ message: "Quiz submited successfully" });
    } catch (error) {
      console.error("Failed to join Quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

async function liveGame() {
  Quiz.aggregate([
    {
      $match: { isLive: true },
    },
    {
      $lookup: {
        from: "quiz-players",
        localField: "_id",
        foreignField: "quizGameId",
        as: "playerDetails",
      },
    },
  ]).exec(async (err, liveGame) => {
    liveGame = liveGame[0];
    // console.log(liveGame);
    if (liveGame?.playerDetails.length > 0) {
      const GameDateTime = new Date(liveGame.dateTime);
      GameDateTime.setSeconds(
        GameDateTime.getSeconds() + parseInt(liveGame.timeInSeconds)
      );
      QuizPlayer.countDocuments(
        { quizGameId: liveGame._id },
        async (err, totalPlayer) => {
          const condition = {
            quizGameId: liveGame._id,
            isSubmited: true,
            // score: { $ne: 0 },
          };
          console.log("totalPlayer :: " + totalPlayer);
          QuizPlayer.countDocuments(condition, async (err, submitedQuiz) => {
            console.log("submitedQuiz :: " + submitedQuiz);
            const currentDateTime = new Date();
            const quizGame = await Quiz.findById(liveGame._id);
            if (quizGame.resultEmited == false) {
              if (totalPlayer == submitedQuiz) {
                // setTimeout(() => {
                emitQuizResult(liveGame._id);
                quizGame.resultEmited = true;
                quizGame.save();
                console.log("All Player");
                // }, 1000);
              } else if (currentDateTime > GameDateTime) {
                setTimeout(() => {
                  emitQuizResult(liveGame._id);
                  quizGame.resultEmited = true;
                  quizGame.save();
                  console.log("Times Up");
                }, 5000);
              }
            }
          });
        }
      );
    } else {
      console.log("No Players");
    }
    return;
  });
}
async function emitQuizResult(quizID) {
  // const { id } = quizID;
  const quizGame = await Quiz.findById(quizID);
  // const quizTemplate = await QuizTemplate.findById(quizGame.templateId);

  const quizPlayers = await QuizPlayer.find({ quizGameId: quizID });
  var noWinner = true;
  var jackpotPrice = 0;
  const condition = {
    quizGameId: quizID,
    isWinner: true,
  };
  QuizPlayer.countDocuments(condition, (err, winner) => {
    if (winner > 0) {
      noWinner = false;
    } else {
      let newPrice =
        parseFloat(quizGame.price) + parseFloat(quizGame.jackpotPrice);
      jackpotPrice = (parseFloat(quizGame.jackpotPercentage) / 100) * newPrice;
      Quiz.findOne({ order: 1 }, (err, nextQuizGame) => {
        if (err) {
          console.error(err);
        } else {
          if (nextQuizGame) {
            nextQuizGame.jackpotPrice =
              parseFloat(quizGame.jackpotPrice) + parseFloat(jackpotPrice);
            nextQuizGame.save();
          }
        }
      });
    }
  });

  var Players = [];
  quizPlayers.forEach(async (player) => {
    // var p = await User.findById(player.playerId);
    User.findById(player.playerId).exec(async (err, p) => {
      var Points = p.points;
      var cashPrice = p.cashPrice;

      PlayersData = {
        id: player._id,
        playerId: player.playerId,
        playerName: p.username,
        playerImage: p.profileImage ?? "",
        playerScore: player.score,
        totalScore: quizGame.noOfQuestions,
        playerTime: player.time ?? "00:00",
        isWinner: player.isWinner,
        city: p.city,
        country: p.country,
        name: p.name,
      };
      Players.push(PlayersData);

      const allPoints = await Point.find();
      const id = allPoints[0]._id;
      const point = await Point.findById(id);

      if (player.isWinner == true) {
        Points = Points + point.winning_quiz;
        const userRewardData = {
          userId: player.playerId,
          type: "point",
          reward: point.winning_quiz,
          referenceId: quizID,
          message:
            "Points earned for winning Quiz Game (" + quizGame.quizTitle + ").",
          isWithdraw: false,
        };
        UserController.userRewards(userRewardData);

        cashPrice = parseFloat(cashPrice) + parseFloat(quizGame.price);
        var R = quizGame.price;
        if (quizGame.jackpotPrice && quizGame.jackpotPrice != 0) {
          cashPrice = parseFloat(cashPrice) + parseFloat(quizGame.jackpotPrice);
          R = parseFloat(R) + parseFloat(quizGame.jackpotPrice);
        }

        const userRewardData1 = {
          userId: player.playerId,
          type: "price",
          reward: R,
          referenceId: quizID,
          message:
            "Price Payout for winning Quiz Game (" + quizGame.quizTitle + ").",
          isWithdraw: false,
        };
        UserController.userRewards(userRewardData1);
      } else if (quizGame.noOfQuestions == player.score) {
        Points = Points + point.correct_all_answers;
        const userRewardData2 = {
          userId: player.playerId,
          type: "point",
          reward: point.correct_all_answers,
          referenceId: quizID,
          message:
            "Points earned for correct all answers 100% of questions of " +
            quizGame.quizTitle +
            " Quiz.",
          isWithdraw: false,
        };
        UserController.userRewards(userRewardData2);
      }

      p.points = Points;
      p.cashPrice = cashPrice;
      p.save();
    });
  });

  setTimeout(() => {
    const player = Players;

    player.sort((playerA, playerB) => {
      if (playerA.playerScore !== playerB.playerScore) {
        return playerB.playerScore - playerA.playerScore; // Sort by score in descending order
      } else {
        const [secondsA, millisecondsA] = playerA.playerTime.split(":");
        const [secondsB, millisecondsB] = playerB.playerTime.split(":");

        const totalMillisecondsA =
          parseInt(secondsA) * 1000 + parseInt(millisecondsA);
        const totalMillisecondsB =
          parseInt(secondsB) * 1000 + parseInt(millisecondsB);

        return totalMillisecondsA - totalMillisecondsB; // Sort by time in ascending order
      }
    });
    // res.status(200).json({ message: "Quiz Players", data: player });
    quizData = {
      quizGameId: quizID,
      quizTitle: quizGame.quizTitle,
      quizPrice: quizGame.price,
    };
    var resultData = {
      quizData: quizData,
      player: player,
      noWinner: noWinner,
      jackpotPrice: jackpotPrice,
    };

    const quizRoom = `quiz_room_${quizID}`;
    global.io.to(quizRoom).emit("quiz-result", {
      data: resultData,
    });
  }, 1000);
  return true;
}

// compare time in milli seconds
function compareTimeInMilliSec(time1, time2) {
  const [seconds1, milliseconds1] = time1.split(":");
  const [seconds2, milliseconds2] = time2.split(":");

  // Convert to total milliseconds
  const totalMilliseconds1 =
    parseInt(seconds1) * 1000 + parseInt(milliseconds1);
  const totalMilliseconds2 =
    parseInt(seconds2) * 1000 + parseInt(milliseconds2);

  // Compare the times
  if (totalMilliseconds1 > totalMilliseconds2) {
    // console.log(`${time1} is later than ${time2}`);
    return "1";
  } else if (totalMilliseconds1 < totalMilliseconds2) {
    // console.log(`${time1} is earlier than ${time2}`);
    return "2";
  } else {
    // console.log(`${time1} and ${time2} are the same time`);
    return "3";
  }
}

const getQuizLeaderBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const quizGame = await Quiz.findById(id);
    var quizPlayers = [];
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    });
    const { error, value } = paginationSchema.validate(req.query);
    const { page, pageSize } = value;
    const skip = (page - 1) * pageSize;

    const val = req.query;
    if (isEmpty(val)) {
      quizPlayers = await QuizPlayer.find({ quizGameId: id });
    } else {
      quizPlayers = await QuizPlayer.find({ quizGameId: id })
        .skip(skip)
        .limit(pageSize)
        .exec();
    }

    // const quizTemplate = await QuizTemplate.findById(quizGame.templateId);

    if (quizPlayers.length == 0) {
      return res.status(404).json({ message: "Quiz Players not found" });
    }
    var Players = [];
    quizPlayers.forEach(async (player) => {
      var p = await User.findById(player.playerId);
      PlayersData = {
        id: player._id,
        playerId: player.playerId,
        name: p.name,
        playerName: p.username,
        playerImage: p.profileImage ?? "",
        playerScore: player.score,
        totalScore: quizGame.noOfQuestions,
        playerTime: player.time ?? "00:00",
        isWinner: player.isWinner,
      };
      Players.push(PlayersData);
    });
    setTimeout(async () => {
      const player = Players;

      player.sort((playerA, playerB) => {
        if (playerA.playerScore !== playerB.playerScore) {
          return playerB.playerScore - playerA.playerScore; // Sort by score in descending order
        } else {
          const [secondsA, millisecondsA] = playerA.playerTime.split(":");
          const [secondsB, millisecondsB] = playerB.playerTime.split(":");

          const totalMillisecondsA =
            parseInt(secondsA) * 1000 + parseInt(millisecondsA);
          const totalMillisecondsB =
            parseInt(secondsB) * 1000 + parseInt(millisecondsB);

          return totalMillisecondsA - totalMillisecondsB; // Sort by time in ascending order
        }
      });

      // Get the total count of questions (for pagination)
      const totalCount = await QuizPlayer.countDocuments({
        quizGameId: id,
      });

      // Calculate total pages based on pageSize
      const totalPages = Math.ceil(totalCount / pageSize);

      res.status(200).json({
        message: "Quiz Players",
        data: player,
        page: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalCount: totalCount,
      });
    }, 1000);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

function isEmpty(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
}

const getPastQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quizPlayers = await QuizPlayer.find({ playerId: id }).sort({
      createdAt: -1,
    });
    if (quizPlayers.length == 0) {
      return res.status(404).json({ message: "Quiz Players not found" });
    }
    var QuizData = [];
    quizPlayers.forEach(async (quiz) => {
      var Q = await Quiz.aggregate([
        {
          $match: { _id: quiz.quizGameId },
        },
        {
          $lookup: {
            from: "quiz-templates",
            localField: "templateId",
            foreignField: "_id",
            as: "templateDetails",
          },
        },
        {
          $unwind: "$templateDetails",
        },
        {
          $lookup: {
            from: "quiz-categories",
            localField: "templateDetails.category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: "$categoryDetails",
        },
      ]);
      PlayersData = {
        id: quiz._id,
        quizGameId: quiz.quizGameId,
        quizTitle: Q[0].quizTitle,
        image: Q[0].image,
        dateTime: Q[0].dateTime,
        category: Q[0].categoryDetails.name,
        playerScore: quiz.score,
        playerTime: quiz.time,
        isWinner: quiz.isWinner,
      };
      QuizData.push(PlayersData);
    });
    setTimeout(() => {
      res.status(200).json({ message: "Quiz Players", data: QuizData });
    }, 1000);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteExtraQuiz = async (req, res) => {
  try {
    // Get Quiz Game IDs from the players collection
    QuizPlayer.distinct("quizGameId", (err, playerGameIds) => {
      if (err) {
        console.error("Error fetching player game IDs:", err);
      } else {
        console.log(playerGameIds);
        const todayStart = moment().startOf("day");
        const todayEnd = moment().endOf("day");

        // Delete Quiz where gameId is not in playerGameIds
        Quiz.deleteMany(
          {
            _id: { $nin: playerGameIds },
            createdAt: { $lt: todayStart.toDate() },
          },
          (deleteErr, result) => {
            if (deleteErr) {
              console.error("Error deleting games:", deleteErr);
            } else {
              // Delete Quiz Question where gameId is not in playerGameIds
              QuizQuestion.deleteMany(
                {
                  quizGameId: { $nin: playerGameIds },
                  createdAt: {
                    $lt: todayStart.toDate(),
                  },
                },
                (deleteQErr, Qresult) => {
                  if (deleteQErr) {
                    console.error("Error deleting games:", deleteQErr);
                  } else {
                    console.log("Deleted games:", Qresult);
                    res.status(200).json({ message: "Quiz Deleted" });
                  }
                }
              );
              console.log("Deleted games:", result);
            }
          }
        );
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuizList = async (req, res) => {
  try {
    const { id } = req.params;

    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default("createdAt"),
      order: Joi.string().default("desc"),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize, sortBy, order } = value;
    const skip = (page - 1) * pageSize;

    // Get Quiz Game IDs from the players collection
    QuizPlayer.distinct("quizGameId", (err, playerGameIds) => {
      if (err) {
        console.error("Error fetching player game IDs:", err);
      } else {
        try {
          const pipeline = [
            {
              $match: { _id: { $in: playerGameIds } },
            },
            {
              $lookup: {
                from: "quiz-templates",
                localField: "templateId",
                foreignField: "_id",
                as: "templateDetails",
              },
            },
            {
              $unwind: "$templateDetails",
            },
            {
              $lookup: {
                from: "quiz-categories",
                localField: "templateDetails.category",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            {
              $unwind: "$categoryDetails",
            },
          ];
          if (id) {
            pipeline.push({
              $match: {
                templateId: mongoose.Types.ObjectId(id),
              },
            });
          }
          Quiz.aggregate(pipeline)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(pageSize)
            .exec(async (err, quizGames) => {
              var QuizData = [];
              quizGames.forEach(async (quiz) => {
                try {
                  var TempQuizData = {
                    _id: quiz._id,
                    templateId: quiz.templateId,
                    quizTitle: quiz.quizTitle,
                    image: quiz.image,
                    dateTime: quiz.dateTime,
                    categoryId: quiz.templateDetails.category,
                    category: quiz.categoryDetails.name,
                    description: quiz.templateDetails.description,
                    userLimit: quiz.templateDetails.userLimit,
                    price: quiz.price,
                    points: quiz.points,
                    jackpotPercentage: quiz.jackpotPercentage,
                    timeInSeconds: quiz.timeInSeconds,
                    noOfQuestions: quiz.noOfQuestions,
                    jackpotPrice: quiz.jackpotPrice ?? 0,
                    winnerId: quiz.winnerId,
                    highestScore: quiz.highestScore,
                    lowestTime: quiz.lowestTime,
                    order: quiz.order,
                  };
                  QuizData.push(TempQuizData);
                } catch (error) {
                  console.error("Error processing quiz data:", error);
                }
              });
              // setTimeout(() => {
              const sortedQuizzes = QuizData.sort(
                (quizA, quizB) => quizA.order - quizB.order
              );

              const distinctValues = await QuizPlayer.distinct("quizGameId");
              const totalCount = distinctValues.length;

              // Calculate total pages based on pageSize
              const totalPages = Math.ceil(totalCount / pageSize);

              res.json({
                message: "Quiz Games.",
                data: sortedQuizzes,
                page: page,
                pageSize: pageSize,
                totalPages: totalPages,
                totalCount: totalCount,
              });
              // }, 5000);
            });
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Quiz not found" });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuizWinner = async (req, res) => {
  try {
    const { id } = req.params;

    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default("createdAt"),
      order: Joi.string().default("desc"),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize, sortBy, order } = value;
    const skip = (page - 1) * pageSize;

    // Get Quiz Game IDs from the players collection
    QuizPlayer.distinct("quizGameId",{isWinner:true}, (err, playerGameIds) => {
      if (err) {
        console.error("Error fetching player game IDs:", err);
      } else {
        try {
          const pipeline = [
            {
              $match: { _id: { $in: playerGameIds },winnerId: { $exists: true, $ne: null } },
            },
            {
              $lookup: {
                from: "quiz-templates",
                localField: "templateId",
                foreignField: "_id",
                as: "templateDetails",
              },
            },
            {
              $unwind: "$templateDetails",
            },
            {
              $lookup: {
                from: "users",
                localField: "winnerId",
                foreignField: "_id",
                as: "playerDetails",
              },
            },
            {
              $unwind: "$playerDetails",
            },
          ];
          if (id) {
            pipeline.push({
              $match: {
                templateId: mongoose.Types.ObjectId(id),
              },
            });
          }
          Quiz.aggregate(pipeline)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(pageSize)
            .exec(async (err, quizGames) => {
              var QuizData = [];
              quizGames.forEach(async (quiz) => {
                try {
                  var TempQuizData = {
                    _id: quiz._id,
                    templateId: quiz.templateId,
                    quizTitle: quiz.quizTitle,
                    image: quiz.image,
                    dateTime: quiz.dateTime,
                    price: quiz.price,
                    winnerId: quiz.winnerId,
                    username: quiz.playerDetails.username,
                    winnerName: quiz.playerDetails.name,
                    winnerEmail: quiz.playerDetails.email,
                    winnerPhone: quiz.playerDetails.phone,
                    winnerImage: quiz.playerDetails.profileImage,
                    highestScore: quiz.highestScore,
                    lowestTime: quiz.lowestTime,
                  };
                  QuizData.push(TempQuizData);
                } catch (error) {
                  console.error("Error processing quiz data:", error);
                }
              });
              // setTimeout(() => {
              const sortedQuizzes = QuizData.sort(
                (quizA, quizB) => quizA.order - quizB.order
              );

              const distinctValues = await QuizPlayer.distinct("quizGameId",{isWinner:true});
              const totalCount = distinctValues.length;

              // Calculate total pages based on pageSize
              const totalPages = Math.ceil(totalCount / pageSize);

              res.json({
                message: "Quiz Games.",
                data: sortedQuizzes,
                page: page,
                pageSize: pageSize,
                totalPages: totalPages,
                totalCount: totalCount,
              });
              // }, 5000);
            });
        } catch (error) {
          console.log(error);
          res.status(500).json({ message: "Quiz not found" });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getStatisticalCount = async (req, res) => {
  try {
    const registeredMembers = await User.countDocuments({
      isDeleted: { $ne: true },
      roles: { $in: "64ad1875e16808d16e1a21f6" },
    });
    const activeQuizzes = await QuizTemplate.countDocuments({
      isDeleted: { $ne: true },
    });
    const totalPayouts = 0;
    var countData = {
      registeredMembers: registeredMembers,
      activeQuizzes: activeQuizzes,
      totalPayouts: totalPayouts,
    };
    res.status(201).json({
      message: "Dashboard Statistical Count",
      countData: countData,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const TrackPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default("createdAt"),
      order: Joi.string().default("desc"),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize, sortBy, order } = value;
    const skip = (page - 1) * pageSize;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "winnerId",
          foreignField: "_id",
          as: "winnerDetails",
        },
      },
      // {
      //   $unwind: "$userDetails",
      // },
      {
        $match: {
          winnerId: { $exists: true },
        },
      },
    ];
    if (id) {
      pipeline.push({
        $match: {
          templateId: mongoose.Types.ObjectId(id),
        },
      });
    }

    QuizGames.aggregate(pipeline)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(pageSize)
      .exec()
      .then(async (quizGames) => {
        const totalCount = await QuizGames.countDocuments({
          winnerId: { $exists: true },
        });

        // Calculate total pages based on pageSize
        const totalPages = Math.ceil(totalCount / pageSize);

        res.json({
          message: `Message.`,
          data: quizGames,
          page: page,
          pageSize: pageSize,
          totalPages: totalPages,
          totalCount: totalCount,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Failed" });
  }
};
const testData = async (req, res) => {
  try {
    // Question.deleteMany(
    // QuizTemplate.deleteMany(
    QuizGames.deleteMany(
      {
        // createdAt: { $gte: today },
        order: 4,
      },
      (deleteErr, result) => {
        res.json({ message: `${result.deletedCount} deleted.` });
      }
    );
    return;

    QuizTemplate.findOne({
      $and: [
        { isDeleted: { $ne: true } },
        { isActive: true },
        { $or: [{ order: 2 }, { order: 1 }] },
      ],
    }).exec((err, quizTemplate) => {
      console.log(err);
      console.log(quizTemplate);
      setTimeout(() => {
        res.json({
          message: "Quiz Template.",
          quizTemplate: quizTemplate,
        });
      }, 1000);
    });

    return;

    var Order = 4;
    const condition = { order: { $gte: 1, $lte: 4 } };
    Quiz.find(condition)
      .sort("order")
      .exec()
      .then((quizGames) => {
        var excludedTemplate = [];
        if (quizGames.length == 4) {
          quizGames.forEach((Games, index) => {
            excludedTemplate.push(Games.quizTitle);
            const newOrder = index;
            Games.order = newOrder;
            // Games.save();
          });
        } else if (quizGames.length < 4 && quizGames.length > 0) {
          Order = quizGames.length + 1;
        } else if (quizGames.length == 0) {
          Order = 1;
        }

        QuizTemplate.countDocuments(
          { isDeleted: { $ne: true } },
          (err, templateCount) => {
            if (templateCount <= 4) {
              excludedTemplate = [];
            }
          }
        );

        setTimeout(() => {
          QuizTemplate.aggregate([
            {
              $match: {
                isDeleted: { $ne: true },
                title: { $not: { $in: excludedTemplate } },
              },
            },
            {
              $lookup: {
                from: "questions",
                localField: "category",
                foreignField: "category",
                as: "questionDetails",
              },
            },
            {
              $unwind: "$questionDetails",
            },
            // { $sample: { size: Number("$noOfQuestions") } },
            { $sample: { size: 1 } }, // Random sampling
          ]).exec((err, quizTemplate) => {
            console.log(quizTemplate);
            const temp = quizTemplate;
            quizTemplate = quizTemplate[0];
            // var Min = Order * 5;
            const currentDateTIme = moment()
              .add(21, "minutes")
              .format("YYYY-MM-DD hh:mm A");

            const quiz = new Quiz({
              templateId: quizTemplate._id,
              quizTitle: quizTemplate.title,
              dateTime: currentDateTIme,
              price: quizTemplate.price,
              points: quizTemplate.points,
              jackpotPercentage: quizTemplate.jackpotPercentage,
              noOfQuestions: quizTemplate.noOfQuestions,
              timeInSeconds: quizTemplate.timeInSeconds,
              order: Order,
            });
            res.json({
              message: "Quiz created successfully.",
              oldData: quizGames,
              quizTemplate: temp,
              data: quiz,
            });
            return;
            // quiz.save((err, quiz) => {
            //   if (err) {
            //     res.status(500).send({ message: err });
            //     return;
            //   } else {
            //     Question.aggregate([
            //       {
            //         $match: {
            //           isDeleted: { $ne: true },
            //           category: quizTemplate.category,
            //         },
            //       },
            //       { $sample: { size: Number(quizTemplate.noOfQuestions) } },
            //     ]).then((question) => {
            //       var quizQuestionToInsert = [];
            //       question.forEach((q) => {
            //         quizQuestionToInsert.push({
            //           quizGameId: quiz._id,
            //           questionId: q._id,
            //         });
            //       });
            //       QuizQuestion.insertMany(quizQuestionToInsert).then(
            //         (savedQuestion) => {
            //           // res.json({
            //           //   message: "Quiz created successfully.",
            //           //   data: quiz,
            //           //   question: savedQuestion,
            //           // });
            //           return true;
            //         }
            //       );
            //     });
            //   }
            // });
          });
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
        // Handle errors here
      });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports = {
  createQuizGame,
  getQuizGame,
  getQuizById,
  getQuizQuestion,
  quizLoop,
  joinQuizGame,
  submitQuizGame,
  getQuizLeaderBoard,
  getPastQuiz,
  deleteExtraQuiz,
  getQuizList,
  getStatisticalCount,
  TrackPayout,
  getQuizWinner,
  testData,
};
