const Model = require("./order.model");
const Room = require("../rooms/room.model");

const create = async (payload) => {
  try {
    console.log('Creating order with payload:', JSON.stringify(payload, null, 2));
    const { updated_by, paymentMethod, paymentDetails, ...rest } = payload;

    if (!updated_by) {
      throw new Error('User email (updated_by) is required');
    }

    console.log('Finding user with email:', updated_by);
    // Find user by email
    const user = await require('../users/user.model').findOne({ email: updated_by });
    if (!user) {
      console.error('User not found for email:', updated_by);
      throw new Error('User not found');
    }
    console.log('Found user:', { _id: user._id, email: user.email });

    // Set created_by to user's _id and include payment details
    const orderData = {
      ...rest,
      created_by: user._id,
      updated_by: updated_by,
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        paidAt: rest.status === 'confirmed' ? new Date() : null
      },
      status: rest.status === 'paid' ? 'confirmed' : rest.status
    };

    console.log('Final order data:', JSON.stringify(orderData, null, 2));
    
    const order = await Model.create(orderData);
    console.log('Created order:', JSON.stringify(order, null, 2));
    
    // Only populate room and created_by fields that exist
    const populatedOrder = await order.populate([
      {
        path: 'room',
        select: 'name type price status totalGuests'
      },
      {
        path: 'created_by',
        select: 'name email'
      }
    ]);

    return populatedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })));
      throw new Error('Invalid order data: ' + Object.values(error.errors).map(e => e.message).join(', '));
    }
    throw error;
  }
};

const getByOrderNumber = (orderNo, filter) => {
  return Model.findOne({ number: orderNo, ...filter });
};

const list = async ({ filter = {}, search = {}, page = 1, limit = 10 }) => {
  try {
    console.log('List orders with:', { filter, search, page, limit });
    
    const currentPage = Math.max(1, parseInt(page));
    const skip = (currentPage - 1) * parseInt(limit);

    // Build match conditions
    const matchConditions = {};
    
    // Handle status filter
    if (filter?.status) {
      matchConditions.status = filter.status;
    }
    
    // Handle order number search
    if (search?.orderNo) {
      matchConditions.orderNo = new RegExp(search.orderNo, "i");
    }

    console.log('Match conditions:', matchConditions);

    // Get total count
    const total = await Model.countDocuments(matchConditions);
    
    if (total === 0) {
      console.log('No orders found');
      return {
        data: [],
        currentPage: 1,
        totalPages: 0,
        total: 0
      };
    }

    // Fetch orders with pagination and populate references
    const orders = await Model.find(matchConditions)
      .populate({
        path: 'room',
        select: 'name type price status totalGuests',
        model: 'Room'
      })
      .populate({
        path: 'created_by',
        select: 'name email',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log('Found orders:', orders.length);

    const response = {
      data: orders,
      currentPage,
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    };

    console.log('Sending response:', {
      currentPage: response.currentPage,
      totalPages: response.totalPages,
      total: response.total,
      orderCount: response.data.length
    });

    return response;

  } catch (error) {
    console.error('Error in list orders:', error.stack);
    throw error;
  }
};

const updateOrder = async (orderNo, payload) => {
  return await Model.findOneAndUpdate({ number: orderNo }, payload, { new: true });
};

const isAdmin = async (userId) => {
  const user = await require('../users/user.model').findById(userId);
  return user?.roles?.includes('admin') || false;
};

const updateOrderStatus = async (orderNo, updatedBy) => {
  try {
    const order = await Model.findOne({ number: orderNo });
    if (!order) throw new Error('Order not found');

    // Only allow admin or the user who created the order to update status
    const admin = await isAdmin(updatedBy);
    if (!admin && order.created_by.toString() !== updatedBy) {
      throw new Error('Not authorized to update this order');
    }

    order.status = order.status === 'confirmed' ? 'cancelled' : 'confirmed';
    await order.save();
    return order;
  } catch (error) {
    throw error;
  }
};

const removeOrder = async (orderNo) => {
  return await Model.findOneAndDelete({ number: orderNo });
};

const payOrder = async (orderNo, updatedBy) => {
  try {
    const order = await Model.findOne({ number: orderNo });
    if (!order) throw new Error('Order not found');

    // Only allow admin or the user who created the order to pay
    const admin = await isAdmin(updatedBy);
    if (!admin && order.created_by.toString() !== updatedBy) {
      throw new Error('Not authorized to pay for this order');
    }

    order.status = 'paid';
    order.paymentDetails = {
      ...order.paymentDetails,
      paidAt: new Date()
    };
    await order.save();
    return order;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getByOrderNumber,
  list,
  updateOrder,
  updateOrderStatus,
  removeOrder,
  payOrder,
};
