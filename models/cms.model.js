const mongoose = require("mongoose");

const CMS = mongoose.model(
  "CMS",
  new mongoose.Schema(
    {
      cmsKey: { type: String, required: true },
      cmsValue: { type: String, required: true },
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

module.exports = CMS;
