const db = require("../models");
const Joi = require("joi");
const QuizCategory = db.quizcategory;

const createQuizCategory = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const { name, description } = req.body;
      const quizCategory = new QuizCategory({ name, description });
      const savedCategory = await quizCategory.save();
      res.json({
        message: "Quiz category created successfully.",
        data: savedCategory,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create quiz category" });
    }
  }
};

const getQuizCategories = async (req, res) => {
  try {
    const categories = await QuizCategory.find({
      isDeleted: { $ne: true },
    }).sort({ createdAt: "desc" });
    res.json({ message: "Quiz categories found.", data: categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quiz categories" });
  }
};

const getQuizCategoryById = async (req, res) => {
  try {
    const category = await QuizCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Quiz category not found" });
    }
    res.json({ message: "Quiz category found.", data: category });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch quiz category" });
  }
};

const updateQuizCategory = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const category = await QuizCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Quiz category not found" });
      }

      category.name = req.body.name || category.name;
      category.description = req.body.description || category.description;
      category.updatedAt = Date.now();

      const updatedCategory = await category.save();
      res.json({
        message: "Quiz category updated successfully.",
        data: updatedCategory,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz category" });
    }
  }
};

const deleteQuizCategory = async (req, res) => {
  try {
    const deletedCategory = await QuizCategory.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true }
    );
    if (!deletedCategory) {
      return res.status(404).json({ message: "Quiz category not found" });
    }
    deletedCategory.isDeleted = true;
    res.json({
      message: "Quiz category deleted successfully.",
      data: deletedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete quiz category" });
  }
};

const searchQuizCategories = async (req, res) => {
  try {
    const { searchQuery } = req.query;
    const regex = new RegExp(searchQuery, "i"); // Case-insensitive regex
    const categories = await QuizCategory.find({
      isDeleted: { $ne: true },
      $or: [{ name: regex }, { description: regex }],
    });
    if (categories.length > 0) {
      res.json({ message: "Quiz categories.", data: categories });
    } else {
      return res.status(404).json({ message: "Quiz category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to search quiz categories" });
  }
};

module.exports = {
  createQuizCategory,
  getQuizCategories,
  getQuizCategoryById,
  updateQuizCategory,
  deleteQuizCategory,
  searchQuizCategories,
};
