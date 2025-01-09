const router = require("express").Router();
const { secureAPI } = require("../../utils/secure");
const Controller = require("./room.controller");

// Public
router.get("/public", async (req, res, next) => {
  try {
    const result = await Controller.publicRooms();
    res.json({
      data: result,
      msg: "All available rooms are shown successfully",
    });
  } catch (e) {
    next(e);
  }
});

router.get("/public/:number", async (req, res, next) => {
  try {
    const result = await Controller.publicRoomInfo(req.params.number);
    res.json({
      data: result,
      msg: "Room Info is shown successfully",
    });
  } catch (e) {
    next(e);
  }
});

// Admin
router.get("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('GET /rooms query:', req.query);
    const { name, page, limit, status } = req.query;
    const filter = { status };
    const search = { name };
    console.log('Room list params:', { filter, search, page, limit });
    const result = await Controller.list({ filter, search, page, limit });
    console.log('Room list result:', result);
    res.json({
      data: result,
      msg: "Rooms list are shown successfully",
    });
  } catch (e) {
    console.error('Error in GET /rooms:', e);
    next(e);
  }
});

router.get("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('GET /rooms/:id params:', req.params.id);
    const result = await Controller.publicRooms(req.params.id);
    console.log('Room info result:', result);
    res.json({
      data: result,
      msg: "All available rooms are shown successfully",
    });
  } catch (e) {
    console.error('Error in GET /rooms/:id:', e);
    next(e);
  }
});

router.post("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('POST /rooms body:', req.body);
    const result = await Controller.create(req.body);
    console.log('Room creation result:', result);
    res.json({
      data: result,
      msg: "New room is added successfully",
    });
  } catch (e) {
    console.error('Error in POST /rooms:', e);
    next(e);
  }
});

router.put("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('PUT /rooms/:id params:', req.params.id);
    console.log('PUT /rooms/:id body:', req.body);
    const result = await Controller.updateById(req.params.id, req.body);
    console.log('Room update result:', result);
    res.json({
      data: result,
      msg: "Room updated successfully",
    });
  } catch (e) {
    console.error('Error in PUT /rooms/:id:', e);
    next(e);
  }
});

router.patch("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('PATCH /rooms/:id params:', req.params.id);
    console.log('PATCH /rooms/:id body:', req.body);
    const result = await Controller.updateStatus(req.params.id, req.body);
    console.log('Room status update result:', result);
    res.json({
      data: result,
      msg: "Room status updated successfully",
    });
  } catch (e) {
    console.error('Error in PATCH /rooms/:id:', e);
    next(e);
  }
});

router.delete("/:number", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('DELETE /rooms/:number params:', req.params.number);
    const result = await Controller.remove(req.params.number);
    console.log('Room deletion result:', result);
    res.json({
      data: result,
      msg: "Room deleted successfully",
    });
  } catch (e) {
    console.error('Error in DELETE /rooms/:number:', e);
    next(e);
  }
});

module.exports = router;
