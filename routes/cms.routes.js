const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const cmsController = require("../controllers/cms.controller");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join("public/uploads/video");
    // Create the folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/faq", [authJwt.verifyToken], cmsController.getAllFAQs);
  app.get("/faq/:id", [authJwt.verifyToken], cmsController.getFAQById);
  app.post(
    "/faq",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.createFAQ
  );
  app.put(
    "/faq/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.updateFAQ
  );
  app.delete(
    "/faq/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.deleteFAQ
  );
  app.get("/cms", [authJwt.verifyToken], cmsController.getAllCMS);
  app.get("/cms/:key", [authJwt.verifyToken], cmsController.getCMSByKey);
  app.post(
    "/cms",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.createCMS
  );
  app.put(
    "/cms/:key",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.updateCMS
  );
  app.delete(
    "/cms/:key",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.deleteCMS
  );

  app.get("/video", [authJwt.verifyToken], cmsController.getAllVideos);
  app.get("/video/:id", [authJwt.verifyToken], cmsController.getVideoById);
  app.post(
    "/video",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("video"),
    cmsController.createVideo
  );
  app.put(
    "/video/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("video"),
    cmsController.updateVideo
  );
  app.delete(
    "/video/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.deleteVideo
  );

  app.get("/point", [authJwt.verifyToken], cmsController.getAllPoints);
  app.post(
    "/point",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.createPoint
  );
  app.put(
    "/point",
    [authJwt.verifyToken, authJwt.isAdmin],
    cmsController.updatePoint
  );
};
