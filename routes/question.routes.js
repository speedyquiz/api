const { authJwt } = require("../middlewares");
const questionController = require("../controllers/question.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { log } = require("console");
const fsPromises = fs.fsPromises;

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/questionFile"); // Set your destination folder here
  },
  filename: function (req, file, cb) {
    // cb(null, Date.now() + "-" + file.originalname); // Add a timestamp to the filename
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Set up storage for uploaded images
const Qstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const data = req.body;
    const catId = req.params.category;
    const uploadPath = path.join("public/uploads/questions/" + catId);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, path.basename(file.originalname));
  },
});
const Qupload = multer({ storage: Qstorage });

// Set up multer storage
const multi_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const catId = req.params.category;
    const uploadPath = path.join("public/uploads/questions/" + catId);

    // Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname));
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
    "/question",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.getAllQuestions
  );
  app.get(
    "/question/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.getQuestionById
  );
  app.post(
    "/question/:category",
    [authJwt.verifyToken, authJwt.isAdmin],
    Qupload.single("question"),
    questionController.createQuestion
  );
  app.put(
    "/question/:id/:category",
    [authJwt.verifyToken, authJwt.isAdmin],
    Qupload.single("question"),
    questionController.updateQuestion
  );
  app.delete(
    "/question/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.deleteQuestion
  );
  app.post(
    "/question-import/bulk-import",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("excelFile"),
    questionController.bulkQuestionImport
  );
  app.get(
    "/export-question",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.QuestionExport
  );
  app.get(
    "/export-question/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.QuestionExport
  );
  app.get(
    "/search-question",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.searchQuestion
  );

  app.get(
    "/question-by-category/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    questionController.getQuestionsByCategory
  );

  app.post(
    "/question/image-upload/:category",
    [authJwt.verifyToken, authJwt.isAdmin],
    multi_upload.array("images"),
    questionController.bulkImageUpload
  );
};
