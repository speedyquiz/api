const db = require("../models");
const Joi = require("joi");
const path = require("path");
const _ = require("lodash");

const Carousel = db.carousel;

const getAllCarousels = async (req, res) => {
  try {
    const carousel = await Carousel.find({ isDeleted: { $ne: true } });
    res.status(200).json({ message: "Carousel Images", data: carousel });
  } catch (error) {
    console.error("Failed to fetch Carousel Images:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCarouselById = async (req, res) => {
  try {
    const { id } = req.params;
    const carousel = await Carousel.findById(id);
    if (!carousel) {
      return res.status(404).json({ message: "Carousel Image not found" });
    }
    res.status(200).json({ message: "Carousel", data: carousel });
  } catch (error) {
    console.error("Failed to fetch carousel Image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createCarousel = async (req, res) => {
  try {
    const data = req.body;
      const uploadedFiles = req.files.map(async (file) => {
        let imagePath = file.path;
        imageUrl = imagePath.replace(/\\/g, "/");
        imageUrl = imageUrl.replace(/\s+/g, '').toLowerCase();
        I = imageUrl.replace("public/", "");
        const carousel = new Carousel({
          image: I,
          url: data.url,
        });
        await carousel.save();
        return {
          filePath: I,
        };
      });
      let imageCount = uploadedFiles.length;

      res.json({  message: "Carousel created successfully",data:{imageCount}});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload Images" });
  }
};

const updateCarousel = async (req, res) => {
  try {
    const data = req.body;
    const { id } = req.params;
    
    const carousel = await Carousel.findById(id);
    if (!carousel) {
      return res.status(404).json({ message: "Carousel Image not found" });
    }
    if (req.file) {
      const uploadedFiles = req.files.map(async (file) => {
        let imagePath = file.path;
        imageUrl = imagePath.replace(/\\/g, "/");
        imageUrl = imageUrl.replace(/\s+/g, '').toLowerCase();
        I = imageUrl.replace("public/", "");

        carousel.image = I,
        carousel.url = (data.url)?data.url:carousel.url,
        await carousel.save();

        return {
          filePath: I,
        };
      });
    }else{
        carousel.url = (data.url)?data.url:carousel.url,
        await carousel.save();
    }

      res.json({  message: "Carousel updated successfully"});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to upload Images" });
  }
};


const deleteCarousel = async (req, res) => {
  try {
    const { id } = req.params;
    const carousel = await Carousel.findByIdAndUpdate(id, { isDeleted: true });
    if (!carousel) {
      return res.status(404).json({ message: "Carousel Image not found" });
    }

    res.status(200).json({ message: "Carousel Image deleted successfully" });
  } catch (error) {
    console.error("Failed to delete carousel image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllCarousels,
  getCarouselById,
  createCarousel,
  updateCarousel,
  deleteCarousel
};
