const mongoose = require("mongoose");

const FAQ = mongoose.model(
  "FAQ",
  new mongoose.Schema(
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = FAQ;
