const mongoose = require("mongoose");

const Carousel = mongoose.model(
  "Carousel",
  new mongoose.Schema(
    {
      image: { type: String, required: true },
      url: { type: String},
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = Carousel;
