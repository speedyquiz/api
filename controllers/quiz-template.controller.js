const db = require("../models");
const Joi = require("joi");
const QuizTemplate = db.quiztemplate;

const getQuizzTemplates = async (req, res) => {
  try {
    const quizzes = await QuizTemplate.find({ isDeleted: { $ne: true } }).sort(
      "order"
    );
    res.status(200).json({ message: "Quiz Template", data: quizzes });
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllQuizzTemplates = async (req, res) => {
  try {
    const quizzes = await QuizTemplate.find();
    res.status(200).json({ message: "Quiz Template", data: quizzes });
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getQuizTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await QuizTemplate.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz Template not found" });
    }
    res.status(200).json({ message: "Quiz Template", data: quiz });
  } catch (error) {
    console.error("Failed to fetch quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createQuizTemplate = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    title: Joi.string().required(),
    category: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string(),
    userLimit: Joi.string().required(),
    price: Joi.string().required(),
    points: Joi.string().required(),
    jackpotPercentage: Joi.number().required(),
    noOfQuestions: Joi.number().required(),
    timeInSeconds: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      QuizTemplate.findOne()
        .sort({ order: -1 })
        .exec(async (err, result) => {
          var max = result?.order ?? 0;
          const quiz = new QuizTemplate({
            title: data.title,
            category: data.category,
            description: data.description,
            image: data.image,
            userLimit: data.userLimit,
            price: data.price,
            points: data.points,
            jackpotPercentage: data.jackpotPercentage,
            noOfQuestions: data.noOfQuestions,
            timeInSeconds: data.timeInSeconds,
            isActive: true,
            order: max + 1,
          });
          if (req.file) {
            const imagePath = req.file.path;
            var imageUrl = imagePath.replace(/\\/g, "/");
            imageUrl = imageUrl.replace("public/", "");
            quiz.image = imageUrl;
          }
          await quiz.save();
          res.status(201).json({
            message: "Quiz Template created successfully",
            data: quiz,
          });
        });
    } catch (error) {
      console.error("Failed to create quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateQuizTemplate = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    title: Joi.string().required(),
    category: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string(),
    userLimit: Joi.string().required(),
    price: Joi.string().required(),
    points: Joi.string().required(),
    jackpotPercentage: Joi.number().required(),
    noOfQuestions: Joi.number().required(),
    timeInSeconds: Joi.string().required(),
    isActive: Joi.boolean(),
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

      const quiz = await QuizTemplate.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz Template not found" });
      }

      quiz.title = data.title;
      quiz.category = data.category;
      quiz.description = data.description;
      quiz.image = data.image;
      quiz.userLimit = data.userLimit;
      quiz.price = data.price;
      quiz.points = data.points;
      quiz.jackpotPercentage = data.jackpotPercentage;
      quiz.noOfQuestions = data.noOfQuestions;
      quiz.timeInSeconds = data.timeInSeconds;
      quiz.isActive = data.isActive;
      if (req.file) {
        const imagePath = req.file.path;
        var imageUrl = imagePath.replace(/\\/g, "/");
        imageUrl = imageUrl.replace("public/", "");
        quiz.image = imageUrl;
      }
      await quiz.save();

      res
        .status(200)
        .json({ message: "Quiz Templat eupdated successfully", data: quiz });
    } catch (error) {
      console.error("Failed to update quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteQuizTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await QuizTemplate.findByIdAndUpdate(id, { isDeleted: true });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz Template not found" });
    }

    // await quiz.remove();

    res.status(200).json({ message: "Quiz Template deleted successfully" });
  } catch (error) {
    console.error("Failed to delete quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateOrderOfTemplate = async (req, res) => {
  try {
    const newOrder = req.body.templateIds;

    await Promise.all(
      newOrder.map(async (_id, index) => {
        await QuizTemplate.findByIdAndUpdate(_id, { order: index + 1 }); // Assuming order starts from 1
      })
    );

    res.status(200).json({ message: "Templates reordered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const activeDeactiveQuizTemplate = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    isActive: Joi.boolean().required(),
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

      const quiz = await QuizTemplate.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz Template not found" });
      }

      quiz.isActive = data.isActive;
      await quiz.save();

      res
        .status(200)
        .json({ message: "Quiz Template updated successfully", data: quiz });
    } catch (error) {
      console.error("Failed to update quiz:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = {
  getQuizzTemplates,
  getAllQuizzTemplates,
  getQuizTemplateById,
  createQuizTemplate,
  updateQuizTemplate,
  deleteQuizTemplate,
  updateOrderOfTemplate,
  activeDeactiveQuizTemplate,
};
