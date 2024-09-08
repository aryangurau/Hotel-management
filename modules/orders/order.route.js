const router = require("express").Router();
const { checkUser, secureAPI } = require("../../utils/secure");
const OrderController = require("./order.controller");

//Admin
router.get("/", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const { orderNo, page, limit, status } = req.query;

    const filter = { status };
    const search = { orderNo };

    const result = await OrderController.list({ filter, search, page, limit });
    res.json({ data: result, msg: "Order list generated successfully" });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:orderNo",
  secureAPI(["admin", "user"]),
  checkUser,
  async (req, res, next) => {
    try {
      const filter = req.body.filter ?? null;
      const result = await OrderController.getByOrderNumber(
        req?.params?.orderNo,
        filter
      );
      res.json({ data: result, msg: "Order found  successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/createOrder",

  secureAPI(["admin", "user"]),
  async (req, res, next) => {
    try {
      const result = await OrderController.create(req.body);
      res.json({ data: result, msg: "Order created successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/updateById/:orderNo",
  secureAPI(["admin"]),
  async (req, res, next) => {
    try {
      const result = await OrderController.updateOrder(
        req?.params?.orderNo,
        req.body,
      );
      res.json({ data: result, msg: "Order updated  sucessfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/updateStatus/:orderNo",
  secureAPI(["admin"]),
  async (req, res, next) => {
    try {
      const result = await OrderController.updateOrderStatus(
        req.params.orderNo,
        req.body.updated_by
      );
      res.json({
        data: result,
        msg: "status of the Order updated successfullly",
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:number", secureAPI(["admin"]), async (req, res, next) => {
  try {
    const result = await OrderController.removeOrder(req?.params?.number);
    res.json({ data: result, msg: "Order deleted sucessfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
