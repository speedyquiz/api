const db = require("../models");
const Joi = require("joi");
const CMS = db.cms;
const CMSFAQ = db.faq;
const Video = db.video;
const Point = db.point;

const getAllFAQs = async (req, res) => {
  try {
    const faqs = await CMSFAQ.find({ isDeleted: { $ne: true } });
    res.status(200).json({ message: "FAQs", data: faqs });
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    res.status(500).json({ message: "Internal server error 1" });
  }
};

const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await CMSFAQ.findById(id);
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    res.status(200).json({ message: "FAQ", data: faq });
  } catch (error) {
    console.error("Failed to fetch FAQ:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createFAQ = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const faq = new CMSFAQ({
        question: data.question,
        answer: data.answer,
        isDeleted: false,
      });

      await faq.save();
      res.status(201).json({ message: "FAQ created successfully", data: faq });
    } catch (error) {
      console.error("Failed to create FAQ:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateFAQ = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
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

      const faq = await CMSFAQ.findById(id);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }

      faq.question = data.question;
      faq.answer = data.answer;

      await faq.save();

      res.status(200).json({ message: "FAQ updated successfully", data: faq });
    } catch (error) {
      console.error("Failed to update faq:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await CMSFAQ.findByIdAndUpdate(id, { isDeleted: true });
    if (!faq) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res.status(200).json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Failed to delete faq:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCMS = async (req, res) => {
  try {
    const cms = await CMS.find({ isDeleted: { $ne: true } });
    res.status(200).json({ message: "CMS", data: cms });
  } catch (error) {
    console.error("Failed to fetch CMS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCMSByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const cms = await CMS.findOne({ cmsKey: key });
    if (!cms) {
      return res.status(404).json({ message: "not found" });
    }
    res.status(200).json({ message: key, data: cms });
  } catch (error) {
    console.error("Failed to fetch CMS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createCMS = async (req, res) => {
  const data = req.body;

  // Define a custom Joi validation rule for no spaces
  const noSpaces = Joi.string().custom((value, helpers) => {
    if (value.includes(" ")) {
      return helpers.message({ custom: "cmsKey must not contain spaces" });
    }
    return value;
  }, "No spaces allowed");

  const schema = Joi.object({
    cmsKey: Joi.string().required().concat(noSpaces),
    cmsValue: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const cms = new CMS({
        cmsKey: data.cmsKey,
        cmsValue: data.cmsValue,
        isDeleted: false,
      });

      await cms.save();
      res.status(201).json({ message: "CMS created successfully", data: cms });
    } catch (error) {
      console.error("Failed to create CMS:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateCMS = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    cmsValue: Joi.string().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const { key } = req.params;

      const cms = await CMS.findOne({ cmsKey: key });
      if (!cms) {
        return res.status(404).json({ message: "CMS not found" });
      }

      cms.cmsValue = data.cmsValue;

      await cms.save();

      res.status(200).json({ message: "CMS updated successfully", data: cms });
    } catch (error) {
      console.error("Failed to update cms:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteCMS = async (req, res) => {
  try {
    const { key } = req.params;
    const cms = await CMS.findOneAndUpdate(
      { cmsKey: key },
      { isDeleted: true }
    );
    if (!cms) {
      return res.status(404).json({ message: "CMS not found" });
    }

    res.status(200).json({ message: "CMS deleted successfully" });
  } catch (error) {
    console.error("Failed to delete cms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find({ isDeleted: { $ne: true } });
    res.status(200).json({ message: "Videos", data: videos });
  } catch (error) {
    console.error("Failed to fetch Videos:", error);
    res.status(500).json({ message: "Internal server error 1" });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    res.status(200).json({ message: "Video", data: video });
  } catch (error) {
    console.error("Failed to fetch Video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createVideo = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    video: Joi.string(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const videoPath = req.file.path;
      var videoUrl = videoPath.replace(/\\/g, "/");
      videoUrl = videoUrl.replace("public/", "");

      const video = new Video({
        url: videoUrl,
        isDeleted: false,
      });

      await video.save();
      res
        .status(201)
        .json({ message: "Video created successfully", data: video });
    } catch (error) {
      console.error("Failed to create Video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updateVideo = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    video: Joi.string(),
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

      const video = await Video.findById(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const videoPath = req.file.path;
      var videoUrl = videoPath.replace(/\\/g, "/");
      videoUrl = videoUrl.replace("public/", "");
      video.url = videoUrl;

      await video.save();

      res
        .status(200)
        .json({ message: "Video updated successfully", data: video });
    } catch (error) {
      console.error("Failed to update video:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndUpdate(id, { isDeleted: true });
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Failed to delete video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllPoints = async (req, res) => {
  try {
    const allPoints = await Point.find();
    const id = allPoints[0]._id;
    const point = await Point.findById(id);
    if (!point) {
      return res.status(404).json({ message: "Point not found" });
    }
    res.status(200).json({ message: "Point", data: point });
  } catch (error) {
    console.error("Failed to fetch Point:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createPoint = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    signup: Joi.number().required(),
    profile_image: Joi.number().required(),
    bank_account: Joi.number().required(),
    profile_completion: Joi.number().required(),
    watching_ads: Joi.number().required(),
    winning_quiz: Joi.number().required(),
    correct_all_answers: Joi.number().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const point = new Point({});

      await point.save();
      res
        .status(201)
        .json({ message: "Point created successfully", data: point });
    } catch (error) {
      console.error("Failed to create Point:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

const updatePoint = async (req, res) => {
  const data = req.body;
  const schema = Joi.object({
    signup: Joi.number().required(),
    profile_image: Joi.number().required(),
    bank_account: Joi.number().required(),
    profile_completion: Joi.number().required(),
    watching_ads: Joi.number().required(),
    winning_quiz: Joi.number().required(),
    correct_all_answers: Joi.number().required(),
  });
  const validationResult = schema.validate(data);
  if (validationResult.error) {
    res
      .status(400)
      .send({ message: validationResult.error.details[0].message });
    return;
  } else {
    try {
      const allPoints = await Point.find();
      const id = allPoints[0]._id;

      const point = await Point.findById(id);
      if (!point) {
        return res.status(404).json({ message: "Point not found" });
      }

      point.signup = data.signup;
      point.profile_image = data.profile_image;
      point.bank_account = data.bank_account;
      point.profile_completion = data.profile_completion;
      point.watching_ads = data.watching_ads;
      point.winning_quiz = data.winning_quiz;
      point.correct_all_answers = data.correct_all_answers;

      await point.save();

      res
        .status(200)
        .json({ message: "Point updated successfully", data: point });
    } catch (error) {
      console.error("Failed to update Point:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllCMS,
  getCMSByKey,
  createCMS,
  updateCMS,
  deleteCMS,
  getAllVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getAllPoints,
  createPoint,
  updatePoint,
};
