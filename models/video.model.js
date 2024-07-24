const mongoose = require("mongoose");

const Video = mongoose.model(
  "Video",
  new mongoose.Schema(
    {
      url: { type: String, required: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = Video;
