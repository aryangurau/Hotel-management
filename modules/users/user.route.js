const router = require("express").Router();
const controller = require("./user.controller");

router.post("/register", async (req, res, next) => {
  try {
    const result = await controller.register(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
module.exports = router;
