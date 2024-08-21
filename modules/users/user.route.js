const router = require("express").Router();
const multer = require("multer");
const controller = require("./user.controller");
const { validate, forgetPasswordvalidation } = require("./user.validation");
const { secureAPI } = require("../../utils/secure");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "." + file?.originalname.split(".")[1]);
  },
});

const upload = multer({ storage }); //multer(opts)

router.get("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const { name, page, limit, isBlocked, isActive } = req.query;

    const filter = { isBlocked, isActive };
    const search = { name };
    // page = page < 1 ? 1 : page;
    const result = await controller.list({ filter, search, page, limit });
    res.json({ data: result, msg: "user list generated successfully" });
  } catch (err) {
    next(err);
  }
});

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

router.post("/generate-fp-token", async (req, res, next) => {
  try {
    const result = await controller.genForgetPasswordToken(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/verify-fp-token",
  forgetPasswordvalidation,
  async (req, res, next) => {
    try {
      const result = await controller.verifyForgetPasswordToken(req.body);
      res.json({ data: result, msg: "password changed successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/changePassword",
  secureAPI(["admin", "user"]),
  async (req, res, next) => {
    try {
      const result = await controller.changePassword(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.put("/resetPassword", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log("i am here");
    const result = await controller.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/blockUser", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await controller.blockUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await controller.create(req.body);
    res.json({ data: result, msg: "user created successfully" });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await controller.getById(req?.params?.id);
    res.json({ data: result, msg: "user found by ID successfully" });
  } catch (err) {
    next(err);
  }
});

router.put("/profile", secureAPI(["admin", "user"]), async (req, res, next) => {
  try {
    const result = await controller.updateProfile(req.body);
    res.json({ data: result, msg: "profile updated successfully" });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await controller.updateById({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "user data updated by ID successfully" });
  } catch (err) {
    next(err);
  }
});

/*
router.post("/getUserByID", async (req, res, next) => {
  try {
    const result = await controller.getUserByID(req?.body);
    console.log(result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/updateByID", async (req, res, next) => {
  try {
    const result = await controller.updateByID(req?.body);
    console.log(result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const result = await controller.list(req?.params?.id);
    console.log(result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
*/
module.exports = router;

//other type of controlls
//RBAC= Role based acces control  ( admin, user, manager, receptionist)
//ABAC= Attribute based   ( resources like login, create, manage)
//PBAC= permission  based( read, write, update, delete)
