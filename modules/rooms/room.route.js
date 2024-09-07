const router = require("express").Router();
const roomController = require("./room.controller");
const { secureAPI } = require("../../utils/secure");
// const {
//   statusValidation,
//   priceValidation,
//   guestValidation,
// } = require("./room.validation");
const { roomValidation, statusValidation } = require("./room.validation");

//Public
router.get("/public", async (req, res, next) => {
  try {
    const result = await roomController.publicRooms();
    res.json({ data: result, msg: "Available rooms listed" });
  } catch (err) {
    next(err);
  }
});
router.get("/public/:id", async (req, res, next) => {
  try {
    const result = await roomController.PublicRoomInfo(req?.params?.id);
    res.json({ data: result, msg: "public Rooms info found successfully" });
  } catch (err) {
    next(err);
  }
});

//Admin
router.get("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const { roomType, page, limit, roomStatus } = req.query;

    const filter = { roomStatus };
    const search = { roomType };

    const result = await roomController.list({ filter, search, page, limit });
    res.json({ data: result, msg: "Room list generated successfully" });
  } catch (err) {
    next(err);
  }
}); //TODO........

router.get("/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await roomController.getById(req?.params?.id);
    res.json({ data: result, msg: "room found by Id successfully" });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/createRoom",
  roomValidation,
  secureAPI(["admin"]),
  async (req, res, next) => {
    try {
      const result = await roomController.createRoom(req.body);
      res.json({ data: result, msg: "room created successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/updateById/:id", secureAPI(["admin"]), async (req, res, next) => {
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

router.patch(
  "/updateStatus/:id",
  statusValidation,
  secureAPI(["admin"]),
  async (req, res, next) => {
    try {
      const result = await roomController.updateStatus({
        id: req?.params?.id,
        payload: req.body,
      });
      res.json({
        data: result,
        msg: "status of the room updated successfullly",
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/remove/:id", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await roomController.remove(req?.params?.id);
    res.json({ data: result, msg: "room deleted sucessfully" });
  } catch (err) {
    next(err);
  }
});

// router.patch("/updateFilledStatus/:id", async (req, res, next) => {
//   try {
//     const result = await roomController.updateFilledStatus({
//       id: req?.params?.id,
//       payload: req.body,
//     });
//     res.json({ data: result, msg: "status of the room updated successfullly" });
//   } catch (err) {
//     next(err);
//   }
// });

// router.patch("/updateBookedStatus/:id", async (req, res, next) => {
//   try {
//     const result = await roomController.updateBookedStatus({
//       id: req?.params?.id,
//       payload: req.body,
//     });
//     res.json({ data: result, msg: "status of the room updated successfullly" });
//   } catch (err) {
//     next(err);
//   }
// });
// router.patch("/updateEmptyStatus/:id", async (req, res, next) => {
//   try {
//     const result = await roomController.updateEmptyStatus({
//       id: req?.params?.id,
//       payload: req.body,
//     });
//     res.json({ data: result, msg: "status of the room updated successfullly" });
//   } catch (err) {
//     next(err);
//   }
// });

// router.patch("/checkAllStatus/:id", async (req, res, next) => {
//   try {
//     const result = await roomController.checkAllStatus({ id: req?.params?.id });
//     res.json(result);
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = router;
