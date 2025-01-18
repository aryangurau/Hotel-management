const Model = require("./room.model");

const create = async (payload) => {
  try {
    console.log('Creating room with payload:', payload);
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'price', 'totalGuests', 'created_by', 'updated_by'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate numeric fields
    const price = Number(payload.price);
    const totalGuests = Number(payload.totalGuests);

    if (isNaN(price) || price < 750 || price > 10000) {
      throw new Error('Price must be between 750 and 10000');
    }
    if (isNaN(totalGuests) || totalGuests < 1 || totalGuests > 5) {
      throw new Error('Total guests must be between 1 and 5');
    }

    // Create the room
    const room = await Model.create({
      ...payload,
      price,
      totalGuests,
      status: 'empty'
    });

    console.log('Room created successfully:', room);
    return room;
  } catch (error) {
    console.error('Error in room creation:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    // Handle duplicate key error
    if (error.code === 11000) {
      throw new Error('A room with this name already exists');
    }

    throw error;
  }
};

const publicRooms = () => {
  return Model.find({ status: "empty" });
};

const list = async ({ filter, search, page = 1, limit = 10 }) => {
  try {
    console.log('Room list input:', { filter, search, page, limit });
    let currentPage = +page;
    currentPage = currentPage < 1 ? 1 : currentPage;
    const { name } = search;
    const query = [];
    
    if (filter?.status) {
      console.log('Adding status filter:', filter.status);
      query.push({
        $match: {
          status: filter?.status,
        },
      });
    }

    if (name) {
      console.log('Adding name search:', name);
      query.push({
        $match: {
          name: new RegExp(name, "gi"),
        },
      });
    }

    query.push(
      {
        $facet: {
          metadata: [
            {
              $count: "total",
            },
          ],
          data: [
            {
              $skip: (currentPage - 1) * +limit,
            },
            {
              $limit: +limit,
            },
          ],
        },
      },
      {
        $addFields: {
          total: {
            $arrayElemAt: ["$metadata.total", 0],
          },
        },
      },
      {
        $project: {
          metadata: 0,
        },
      }
    );
    
    console.log('Final aggregation query:', JSON.stringify(query, null, 2));
    const result = await Model.aggregate(query);
    console.log('Aggregation result:', result);
    
    const response = {
      data: result[0]?.data || [],
      page: +currentPage,
      limit: +limit,
      total: result[0]?.total || 0,
    };
    console.log('Final response:', response);
    return response;
  } catch (error) {
    console.error('Error in room list:', error);
    throw error;
  }
};

const getById = async (id) => {
  try {
    console.log('Getting room by ID:', id);
    const room = await Model.findById(id);
    
    if (!room) {
      throw new Error('Room not found');
    }

    console.log('Found room:', room);
    return room;
  } catch (error) {
    console.error('Error in getById:', error);
    throw error;
  }
};

const publicRoomInfo = (number) => {
  return Model.findOne({ name: new RegExp(number, "gi"), status: "empty" });
};

const update = async (id, payload) => {
  try {
    console.log('Updating room:', id);
    console.log('Update payload:', payload);

    // Validate required fields
    const requiredFields = ['name', 'type', 'price', 'totalGuests', 'updated_by'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate numeric fields
    const price = Number(payload.price);
    const totalGuests = Number(payload.totalGuests);

    if (isNaN(price) || price < 750 || price > 10000) {
      throw new Error('Price must be between 750 and 10000');
    }
    if (isNaN(totalGuests) || totalGuests < 1 || totalGuests > 5) {
      throw new Error('Total guests must be between 1 and 5');
    }

    // Check if room exists
    const existingRoom = await Model.findById(id);
    if (!existingRoom) {
      throw new Error('Room not found');
    }

    // Convert amenities string to array if provided
    let amenities = payload.amenities;
    if (typeof amenities === 'string') {
      amenities = amenities.split(',').map(item => item.trim()).filter(Boolean);
    }

    // Prepare update data
    const updateData = {
      name: payload.name,
      type: payload.type,
      price,
      totalGuests,
      description: payload.description,
      amenities,
      status: payload.status,
      updated_by: payload.updated_by
    };

    // If new images are provided, add them to existing images
    if (payload.images?.length) {
      updateData.images = payload.images;
    }

    console.log('Update data:', updateData);

    // Update room
    const room = await Model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Room updated:', room);
    return room;
  } catch (error) {
    console.error('Error in update:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const updateById = (id, payload) => {
  return Model.findOneAndUpdate({ _id: id }, payload, { new: true });
};

const updateStatus = (id, payload) => {
  return Model.findOneAndUpdate({ _id: id }, payload, { new: true });
};

const remove = async (number) => {
  try {
    const room = await Model.findOne({ name: new RegExp(number, "gi") });
    if (room.status !== "empty") {
      throw new Error(
        "Room is not empty at the moment. Please empty the room before deleting"
      );
    }
    return Model.deleteOne({ name: new RegExp(number, "gi") });
  } catch (error) {
    console.error('Error in room removal:', error);
    throw error;
  }
};

module.exports = {
  create,
  publicRooms,
  list,
  getById,
  publicRoomInfo,
  update,
  updateById,
  updateStatus,
  remove,
};
