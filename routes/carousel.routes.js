const { authJwt } = require("../middlewares");
const carouselController = require("../controllers/carousel.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { log } = require("console");
const fsPromises = fs.fsPromises;


// Set up multer storage
const multi_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("public/uploads/carousel");

    // Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    let imagePath = path.basename(file.originalname);
    imageUrl = imagePath.replace(/\\/g, "/");
        imageUrl = imageUrl.replace(/\s+/g, '').toLowerCase();
        I = imageUrl.replace("public/", "");
    cb(null, Date.now() + I);
  },
});

const uploadFilter = function (req, file, cb) {
  const allowedFileTypes = /png|jpe?g|webp/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(null, false, new Error("Only PNG and JPEG files are allowed!"));
  }
};

const multi_upload = multer({
  storage: multi_storage,
  fileFilter: uploadFilter,
});

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/carousel",
    [authJwt.verifyToken],
    carouselController.getAllCarousels
  );
  app.get(
    "/carousel/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    carouselController.getCarouselById
  );
  app.post(
    "/carousel",
    [authJwt.verifyToken, authJwt.isAdmin],
    multi_upload.array("images"),
    carouselController.createCarousel
  );
  app.put(
    "/carousel/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    multi_upload.array("images"),
    carouselController.updateCarousel
  );
  app.delete(
    "/carousel/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    carouselController.deleteCarousel
  );
};
