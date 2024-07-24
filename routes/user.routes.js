const { authJwt } = require("../middlewares");
const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/user.controller");
const multer = require("multer");
const path = require("path");

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profileImage"); // Set your destination folder here
  },
  filename: function (req, file, cb) {
    // cb(null, Date.now() + "-" + file.originalname); // Add a timestamp to the filename
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

  app.get("/test/all", controller.allAccess);

  // Member Management
  app.get(
    "/member",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUsers
  );
  app.get(
    "/member/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getProfile
  );
  app.post(
    "/member",
    [
      authJwt.verifyToken,
      verifySignUp.checkDuplicateUsernameOrEmail,
      authJwt.isAdmin,
    ],
    controller.createMember
  );
  app.put(
    "/member/:id",
    [authJwt.verifyToken, authJwt.isAdmin],
    upload.single("profileImage"),
    controller.updateProfile
  );
  app.delete(
    "/member/:id",
    [authJwt.verifyToken],
    controller.deleteMember
  );
  app.get(
    "/search-member",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.searchMember
  );

  app.get(
    "/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );

  // Auth
  app.put(
    "/change-password/:id",
    [authJwt.verifyToken],
    controller.changePassword
  );

  app.get(
    "/user/get-profile/:id",
    [authJwt.verifyToken],
    controller.getProfile
  );

  app.put(
    "/user/update-profile/:id",
    [authJwt.verifyToken],
    upload.single("profileImage"),
    controller.updateProfile
  );

  app.get(
    "/user/get-my-rewards/:id",
    [authJwt.verifyToken],
    controller.getMyRewards
  );

  app.post(
    "/user/add-stripeid/:id",
    [authJwt.verifyToken],
    controller.addStripeID
  );

  app.post(
    "/user/add-bank/:id",
    [authJwt.verifyToken],
    controller.addBankDetails
  );

  app.get(
    "/user/get-bank-details/:id",
    [authJwt.verifyToken],
    controller.getBankDetails
  );

  app.post(
    "/user/add-ads-points/:id",
    [authJwt.verifyToken],
    controller.addAdsPoints
  );

  app.post("/user/payout/:id", [authJwt.verifyToken], controller.payoutPrice);
};
