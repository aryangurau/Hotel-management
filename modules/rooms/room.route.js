const router = require("express").Router();
const roomController = require("./room.controller");
const { secureAPI } = require("../../utils/secure");

router.post("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await roomController.createRoom(req.body);
    res.json({ data: result, msg: "room created successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
