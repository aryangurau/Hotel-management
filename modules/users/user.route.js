const router = require("express").Router();
const multer = require("multer");
const controller = require("./user.controller");
const { validate } = require("./user.validation");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + file?.originalname.split(".")[1]);
  },
});

const upload = multer({ storage }); //multer(opts)

router.post("/login", validate, async (req, res, next) => {
  try {
    const result = await controller.login(req?.body);
    res.json({ data: result, msg: "user logged in successfully" });
  } catch (err) {
    next(err);
  }
});

router.post("/register", upload.single("image"), async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = req.file.filename;
    }
    const result = await controller.register(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/verify-email", async (req, res, next) => {
  try {
    const result = await controller.verifyEmailToken(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
module.exports = router;
