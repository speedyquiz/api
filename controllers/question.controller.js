const db = require("../models");
const Joi = require("joi");
const exceljs = require("exceljs");

const path = require("path");
// const moment = require("moment");
const _ = require("lodash");
const Question = db.question;
const QuizCategory = db.quizcategory;
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const mongoose = require("mongoose");
const { log } = require("console");

const getAllQuestions = async (req, res) => {
  try {
    // Define a Joi schema for pagination validation
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize } = value;
    const skip = (page - 1) * pageSize;

    const questions = await Question.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: "desc" })
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get the total count of questions (for pagination)
    const totalCount = await Question.countDocuments({
      isDeleted: { $ne: true },
    });

    // Calculate total pages based on pageSize
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: "Question",
      data: questions,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json({ message: "Question", data: question });
  } catch (error) {
    console.error("Failed to fetch question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuestionsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Define a Joi schema for pagination validation
    const paginationSchema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    });

    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { page, pageSize } = value;
    const skip = (page - 1) * pageSize;

    const questions = await Question.find({
      category: id,
      isDeleted: { $ne: true },
    })
      .skip(skip)
      .limit(pageSize)
      .exec();

    // Get the total count of questions (for pagination)
    const totalCount = await Question.countDocuments({
      category: id,
      isDeleted: { $ne: true },
    });

    // Calculate total pages based on pageSize
    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      message: "Question",
      data: questions,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages,
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createQuestion = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    question: Joi.string(),
    category: Joi.string().required(),
    type: Joi.string().required(),
    rightOption: Joi.string().required(),
    wrongOption1: Joi.string().required(),
    wrongOption2: Joi.string().required(),
    wrongOption3: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      let Q = "";
      if (data.type == "Image") {
        const imagePath = req.file.path;
        imageUrl = imagePath.replace(/\\/g, "/");
        Q = imageUrl.replace("public/", "");
        // Q = "public/uploads/questions/" + data.category + "/" + "";
      } else {
        Q = data.question;
      }
      const question = new Question({
        question: Q,
        category: data.category,
        type: data.type,
        rightOption: data.rightOption,
        wrongOption1: data.wrongOption1,
        wrongOption2: data.wrongOption2,
        wrongOption3: data.wrongOption3,
      });
      await question.save();
      res
        .status(201)
        .json({ message: "Question created successfully", data: question });
    } catch (error) {
      console.error("Failed to create question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateQuestion = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    question: Joi.string(),
    type: Joi.string().required(),
    category: Joi.string().required(),
    rightOption: Joi.string().required(),
    wrongOption1: Joi.string().required(),
    wrongOption2: Joi.string().required(),
    wrongOption3: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const { id } = req.params;
      const question = await Question.findById(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      let Q = "";
      if (data.type == "Image") {
        if (req.file) {
          const imagePath = req.file.path;
          imageUrl = imagePath.replace(/\\/g, "/");
          Q = imageUrl.replace("public/", "");
          question.question = Q;
        }
        // Q = "public/uploads/questions/" + data.category + "/" + "";
      } else {
        Q = data.question;
        question.question = Q;
      }

      question.category = data.category;
      question.type = data.type;
      question.rightOption = data.rightOption;
      question.wrongOption1 = data.wrongOption1;
      question.wrongOption2 = data.wrongOption2;
      question.wrongOption3 = data.wrongOption3;
      await question.save();

      res
        .status(200)
        .json({ message: "Question updated successfully", data: question });
    } catch (error) {
      console.error("Failed to update question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndUpdate(id, { isDeleted: true });
    // const question = await Question.deleteMany({});
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // await question.remove();

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Failed to delete question:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const bulkQuestionImportOld = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // QuizCategory.deleteMany(
    // Question.deleteMany(
    //   {
    //     createdAt: { $gte: today },
    //   },
    //   (deleteErr, result) => {
    //     res.json({ message: `${result.deletedCount} categories deleted.` });
    //   }
    // );
    // return;
    if (req.file) {
      const filePath = req.file.path;
      // const fileUrl = filePath.replace(/\\/g, "/");
      const workbook = new exceljs.Workbook();
      await workbook.csv.readFile(filePath);
      const worksheet = workbook.getWorksheet(1);
      const data = [];
      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber !== 1) {
          // console.log(Cat);

          const rowData = {
            no: row.getCell(1).value,
            category: row.getCell(2).value,
            difficulty: row.getCell(3).value,
            question: row.getCell(4).value,
            correct: row.getCell(5).value,
            incorrect1: row.getCell(6).value,
            incorrect2: row.getCell(7).value,
            incorrect3: row.getCell(8).value,
          };
          data.push(rowData);
        }
      });
      const uniqueData = _.uniqBy(data, "category");
      const catData = [];
      uniqueData.forEach(async (categoryDetail) => {
        const quizCategory = await QuizCategory.findOne({
          name: categoryDetail.category,
        });
        var Cat = quizCategory;
        if (!quizCategory || quizCategory.length == 0) {
          const catName = categoryDetail.category;
          const catDesc = categoryDetail.category;
          const saveQuizCategory = new QuizCategory({
            name: catName,
            description: catDesc,
          });
          await saveQuizCategory.save();
          catData.push(saveQuizCategory);
        } else {
          catData.push(quizCategory);
        }
      });
      setTimeout(() => {
        const questionData = [];
        data.forEach(async (question) => {
          const foundObject = catData.find(
            (item) => item.name === question.category
          );
          console.log(question);
          if (foundObject) {
            const { _id } = foundObject;
            try {
              const newQuestion = new Question({
                question: question.question,
                difficulty: question.difficulty,
                category: _id,
                rightOption: question.correct,
                wrongOption1: question.incorrect1,
                wrongOption2: question.incorrect2,
                wrongOption3: question.incorrect3,
              });
              await newQuestion.save();
            } catch (error) {
              console.error("Failed to create question:", error);
              res.status(500).json({ message: "Internal server error" });
            }
          }
        });
        // setTimeout(() => {
        res.json({ message: "Data imported successfully." });
        // }, 60000);
      }, 60000);
    } else {
      res
        .status(400)
        .send({ message: "Excel File required. Error importing data." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error importing data." });
  }
};

const bulkQuestionImport = async (req, res) => {
  try {
    const data = req.body;
    const schema = Joi.object({
      category: Joi.string().required(),
    });
    const validationResult = schema.validate(data);
    if (validationResult.error) {
      res
        .status(400)
        .send({ message: validationResult.error.details[0].message });
      return;
    } else {
      if (req.file) {
        const filePath = req.file.path;
        const workbook = new exceljs.Workbook();
        await workbook.csv.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);
        const data = [];
        const head = worksheet.getRow(1).values;

        if (
          head[1] != "#" ||
          head[2] != "Category" ||
          head[3] != "Difficulty" ||
          head[4] != "Type" ||
          head[5] != "Question" ||
          head[6] != "Correct A" ||
          head[7] != "Incorrect 1" ||
          head[8] != "Incorrect 2" ||
          head[9] != "Incorrect 3"
        ) {
          res.status(400).send({
            message: "File Data Format is not valid. Error importing data.",
          });
          return;
        } else {
          worksheet.eachRow(async (row, rowNumber) => {
            if (rowNumber !== 1) {
              var Q = row.getCell(5).value;
              if (row.getCell(4).value.toLowerCase() == "image") {
                Q =
                  "uploads/questions/" +
                  req.body.category +
                  "/" +
                  row.getCell(5).value;
              }
              const rowData = {
                questionNo: row.getCell(1).value,
                question: Q,
                difficulty: row.getCell(3).value,
                type: row.getCell(4).value,
                category: req.body.category,
                rightOption: row.getCell(6).value,
                wrongOption1: row.getCell(7).value,
                wrongOption2: row.getCell(8).value,
                wrongOption3: row.getCell(9).value,
              };
              data.push(rowData);
              console.log(rowData);
            }
          });
          setTimeout(() => {
            Question.insertMany(data).then(() => {
              res.json({ message: "Data imported successfully." });
            });
          }, 5000);
        }
      } else {
        res
          .status(400)
          .send({ message: "Excel File required. Error importing data." });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error importing data." });
  }
};

const QuestionExport = async (req, res) => {
  try {
    const { id } = req.params;

    const pipeline = [
      {
        $lookup: {
          from: "quiz-categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      // {
      //   $unwind: "$categoryDetails",
      // },
      {
        $match: {
          isDeleted: { $ne: true },
        },
      },
    ];
    if (id) {
      pipeline.push(
        {
          $match: {
            category: mongoose.Types.ObjectId(id),
          },
        },
        {
          $project: {
            _id: 1,
            questionNo: 1,
            difficulty: 1,
            type: 1,
            question: 1,
            rightOption: 1,
            wrongOption1: 1,
            wrongOption2: 1,
            wrongOption3: 1,
            categoryName: { $arrayElemAt: ["$categoryDetails.name", 0] },
          },
        }
      );
    } else {
      pipeline.push({
        $project: {
          _id: 1,
          questionNo: 1,
          difficulty: 1,
          type: 1,
          question: 1,
          rightOption: 1,
          wrongOption1: 1,
          wrongOption2: 1,
          wrongOption3: 1,
          categoryName: { $arrayElemAt: ["$categoryDetails.name", 0] },
        },
      });
    }
    Question.aggregate(pipeline)
      .exec()
      .then((questions) => {
        console.log(questions);

        const modifiedQuestions = questions.map((entry) => ({
          ...entry,
          difficulty: entry.difficulty ?? "Easy",
          type: entry.type ?? "Text",
          question:
            entry.type == "Image" || entry.type == "image"
              ? getLastSegment(entry.question)
              : entry.question,
        }));

        const csvWriter = createCsvWriter({
          path: "public/uploads/export/exported_data.csv",
          header: [
            { id: "questionNo", title: "#" },
            { id: "categoryName", title: "Category" },
            { id: "difficulty", title: "Difficulty" },
            { id: "type", title: "Type" },
            { id: "question", title: "Question" },
            { id: "rightOption", title: "Correct A" },
            { id: "wrongOption1", title: "Incorrect 1" },
            { id: "wrongOption2", title: "Incorrect 2" },
            { id: "wrongOption3", title: "Incorrect 3" },
          ],
        });

        // Write data to the CSV file
        csvWriter
          .writeRecords(modifiedQuestions)
          .then(() => {
            // Send the generated CSV file as a response
            const publicUrl = `${req.protocol}://${req.get(
              "host"
            )}/uploads/export/exported_data.csv`;

            // Send the URL in the API response
            res.json({
              message: "Data exported successfully.",
              url: publicUrl,
            });
          })
          .catch((error) => {
            console.error("Error exporting data:", error);
            res.status(500).json({ error: "Internal Server Error" });
          });
      })
      .catch((error) => {
        console.error(error);
        // Handle errors here
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error importing data." });
  }
};

function getLastSegment(parsedUrl) {
  const pathSegments = parsedUrl.split("/").filter((segment) => segment !== "");
  return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
}

const searchQuestion = async (req, res) => {
  try {
    const { searchQuery } = req.query;
    const regex = new RegExp(searchQuery, "i"); // Case-insensitive regex
    const question = await Question.find({
      isDeleted: { $ne: true },
      $or: [{ question: regex }],
    });
    if (question.length > 0) {
      res.json({ message: "Questions.", data: question });
    } else {
      return res.status(404).json({ message: "Question not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to search Questions" });
  }
};

const bulkImageUpload = async (req, res) => {
  try {
    const data = req.params;
    const schema = Joi.object({
      category: Joi.string().required(),
    });
    const validationResult = schema.validate(data);
    if (validationResult.error) {
      res
        .status(400)
        .send({ message: validationResult.error.details[0].message });
      return;
    } else {
      const category = req.params.category;
      const uploadedFiles = req.files.map((file) => {
        return {
          filePath: file.path,
        };
      });
      let imageCount = uploadedFiles.length;

      res.json({ category, imageCount, uploadedFiles });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload Images" });
  }
};

module.exports = {
  getAllQuestions,
  getQuestionById,
  getQuestionsByCategory,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkQuestionImport,
  QuestionExport,
  searchQuestion,
  bulkImageUpload,
};
