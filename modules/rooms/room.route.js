const router = require("express").Router();
const { secureAPI } = require("../../utils/secure");
const Controller = require("./room.controller");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/rooms';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

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

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('GET /rooms/:id - Room ID:', id);
    
    const result = await Controller.getById(id);
    console.log('Room details:', result);

    res.json({
      data: result,
      msg: "Room details retrieved successfully",
    });
  } catch (e) {
    console.error('Error in GET /rooms/:id:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    next(e);
  }
});

router.get("/:number", secureAPI(["admin"]), async (req, res, next) => {
  try {
    console.log('GET /rooms/:number params:', req.params.number);
    const result = await Controller.publicRooms(req.params.number);
    console.log('Room info result:', result);
    res.json({
      data: result,
      msg: "All available rooms are shown successfully",
    });
  } catch (e) {
    console.error('Error in GET /rooms/:number:', e);
    next(e);
  }
});

router.post("/", secureAPI(["admin"]), upload.array('images', 5), async (req, res, next) => {
  try {
    console.log('POST /rooms - Authenticated User:', req.user);
    console.log('POST /rooms - Request Body:', req.body);
    console.log('POST /rooms - Files:', req.files);
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'price', 'totalGuests'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Convert numeric fields
    const payload = {
      ...req.body,
      price: Number(req.body.price),
      totalGuests: Number(req.body.totalGuests),
      created_by: req.user._id,
      updated_by: req.user._id
    };

    // Add image paths if files were uploaded
    if (req.files?.length) {
      payload.images = req.files.map(file => file.path.replace(/\\/g, '/'));
    }

    console.log('Creating room with payload:', payload);
    const result = await Controller.create(payload);
    console.log('Room creation result:', result);
    
    res.json({
      data: result,
      msg: "New room is added successfully",
    });
  } catch (e) {
    console.error('Error in POST /rooms:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    
    // Send appropriate error response
    res.status(400).json({
      data: null,
      msg: e.message || "Failed to create room"
    });
  }
});

router.put("/:id", secureAPI(["admin"]), upload.array('images', 5), async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('PUT /rooms/:id - Room ID:', id);
    console.log('PUT /rooms/:id - Request Body:', req.body);
    console.log('PUT /rooms/:id - Files:', req.files);
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'price', 'totalGuests'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Convert numeric fields and prepare payload
    const payload = {
      name: req.body.name,
      type: req.body.type,
      price: Number(req.body.price),
      totalGuests: Number(req.body.totalGuests),
      description: req.body.description || '',
      amenities: req.body.amenities || '',
      status: req.body.status || 'empty',
      updated_by: req.user._id
    };

    // Add new image paths if files were uploaded
    if (req.files?.length) {
      // Get existing room to preserve old images if needed
      const existingRoom = await Controller.getById(id);
      const newImagePaths = req.files.map(file => file.path.replace(/\\/g, '/'));
      
      // If we want to keep existing images, combine them
      payload.images = [...(existingRoom.images || []), ...newImagePaths];
    }

    console.log('Updating room with payload:', payload);
    const result = await Controller.update(id, payload);
    console.log('Room update result:', result);
    
    res.json({
      data: result,
      msg: "Room updated successfully",
    });
  } catch (e) {
    console.error('Error in PUT /rooms/:id:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    
    // Send appropriate error response
    res.status(400).json({
      data: null,
      msg: e.message || "Failed to update room"
    });
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
