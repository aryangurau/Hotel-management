const router = require("express").Router();
const roomController = require("./room.controller");
const { secureAPI } = require("../../utils/secure");

router.post("/createRoom", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await roomController.createRoom(req.body);
    res.json({ data: result, msg: "room created successfully" });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { roomType, page, limit, isFilled, isBooked, isEmpty } = req.query;

    const filter = { isFilled, isBooked, isEmpty };
    const search = { roomType };
    // page = page < 1 ? 1 : page;
    const result = await roomController.list({ filter, search, page, limit });
    res.json({ data: result, msg: "room list generated successfully" });
  } catch (err) {
    next(err);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const result = await roomController.getById(req?.params?.id);
    res.json({ data: result, msg: "room found by Id successfully" });
  } catch (err) {
    next(err);
  }
});
router.put("/updateById/:id", async (req, res, next) => {
  try {
    const result = await roomController.updateById({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "room updated by id sucessfully" });
  } catch (err) {
    next(err);
  }
});

router.patch("/updateFilledStatus/:id", async (req, res, next) => {
  try {
    const result = await roomController.updateFilledStatus({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "status of the room updated successfullly" });
  } catch (err) {
    next(err);
  }
});

router.patch("/updateBookedStatus/:id", async (req, res, next) => {
  try {
    const result = await roomController.updateBookedStatus({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "status of the room updated successfullly" });
  } catch (err) {
    next(err);
  }
});
router.patch("/updateEmptyStatus/:id", async (req, res, next) => {
  try {
    const result = await roomController.updateEmptyStatus({
      id: req?.params?.id,
      payload: req.body,
    });
    res.json({ data: result, msg: "status of the room updated successfullly" });
  } catch (err) {
    next(err);
  }
});

router.patch("/checkAllStatus/:id", async (req, res, next) => {
  try {
    const result = await roomController.checkAllStatus({ id: req?.params?.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
});
router.get("/list", async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

router.delete("/remove", async (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

module.exports = router;
