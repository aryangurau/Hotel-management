const router = require("express").Router();
const { checkUser, secureAPI } = require("../../utils/secure");
const OrderController = require("./order.controller");

// Get all orders (admin only)
router.get("/list", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('GET /list - Admin orders request:', {
      query: req.query,
      user: req.user
    });

    const { page = 1, limit = 10, status, orderNo } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const search = {};
    if (orderNo) search.orderNo = orderNo;

    console.log('Fetching orders with:', { filter, search, page, limit });
    const result = await OrderController.list({ 
      filter, 
      search, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
    
    console.log('Orders fetched:', {
      total: result.total,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      count: result.data.length
    });

    res.json({
      data: result,
      msg: "Orders fetched successfully"
    });

  } catch (e) {
    console.error('Error in GET /list:', e.stack);
    next(e);
  }
});

// Get user's own orders - MOVED BEFORE /:orderNo route to avoid path conflict
router.get("/my-orders", secureAPI(["admin", "user"]), async (req, res, next) => {
  try {
    console.log('GET /my-orders - User:', req.user); // Debug log
    
    if (!req.user?.email) {
      throw new Error('User email not found in token');
    }

    const { page, limit, status } = req.query;
    const filter = { 
      updated_by: req.user.email
    };
    if (status) {
      filter.status = status;
    }
    
    console.log('Fetching orders with filter:', filter); // Debug log

    // Get orders from controller
    const result = await OrderController.list({ filter, page, limit });
    console.log('Orders found:', JSON.stringify(result, null, 2)); // Debug log

    // Ensure we have a valid response structure
    const responseData = {
      data: result?.data || [],
      currentPage: result?.currentPage || 1,
      totalPages: result?.totalPages || 0,
      total: result?.total || 0,
      msg: "Orders fetched successfully"
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2)); // Debug log
    res.json(responseData);
  } catch (err) {
    console.error('Error in /my-orders:', err); // Debug log
    next(err);
  }
});

// Get single order (admin or owner)
router.get(
  "/:orderNo",
  secureAPI(["admin", "user"]),
  checkUser,
  async (req, res, next) => {
    try {
      console.log('GET /:orderNo - User:', req.user); // Debug log
      const filter = req.body.filter ?? null;
      const result = await OrderController.getByOrderNumber(
        req?.params?.orderNo,
        filter
      );
      res.json({ data: result, msg: "Order found successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Create order (any authenticated user)
router.post("/createOrder", secureAPI(["admin", "user"]), async (req, res, next) => {
  try {
    console.log('POST /createOrder - User:', req.user); // Debug log
    
    if (!req.user?.email) {
      throw new Error('User email not found in token');
    }

    console.log('Request body:', req.body); // Debug log
    
    // Add user email from session and generate order number
    const orderNo = Math.random().toString(36).substring(2, 15).toUpperCase();
    const payload = {
      ...req.body,
      updated_by: req.user.email,
      orderNo, // Use orderNo instead of number
      number: orderNo // Keep number for backward compatibility
    };
    console.log('Creating order with payload:', payload); // Debug log
    
    const result = await OrderController.create(payload);
    console.log('Order created:', result); // Debug log
    
    res.json({ data: result, msg: "Order created successfully" });
  } catch (err) {
    console.error('Error in /createOrder:', err); // Debug log
    next(err);
  }
});

// Update order (admin only)
router.put(
  "/updateById/:orderNo",
  secureAPI(["admin"]),
  async (req, res, next) => {
    try {
      const result = await OrderController.updateOrder(
        req?.params?.orderNo,
        req.body
      );
      res.json({ data: result, msg: "Order updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Update order status (admin or owner)
router.put(
  "/updateStatus/:orderNo",
  secureAPI(["admin", "user"]),
  checkUser,
  async (req, res, next) => {
    try {
      const result = await OrderController.updateOrderStatus(
        req?.params?.orderNo,
        req.user._id
      );
      res.json({ data: result, msg: "Order status updated successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Update order status (admin only)
router.patch('/:orderId/status', secureAPI(["admin"]), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const updatedBy = req.user.email;

    const result = await OrderController.updateOrderStatus({
      orderId,
      status,
      updatedBy
    });

    res.json(result);
  } catch (error) {
    console.error('Route error - update order status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete order (admin only)
router.delete("/:number", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('DELETE /:number - User:', req.user); // Debug log
    const result = await OrderController.removeOrder(req?.params?.number);
    res.json({ data: result, msg: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
