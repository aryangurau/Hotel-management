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
    
    // Ensure valid pagination values
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.min(50, Math.max(5, parseInt(limit))); // Min 5, Max 50
    const skip = (currentPage - 1) * itemsPerPage;

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

    // Get total count from both orders and bookings
    const [orderCount, bookings] = await Promise.all([
      Model.countDocuments(matchConditions),
      require('../bookings/booking.model').find({})
        .populate('roomId', 'name type price status totalGuests')
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Transform bookings to order format
    const bookingOrders = bookings.map(booking => ({
      _id: booking._id,
      orderNo: booking._id.toString().slice(-8).toUpperCase(),
      receiver: booking.guestName,
      room: {
        _id: booking.roomId?._id,
        name: booking.roomId?.name || 'N/A',
        type: booking.roomId?.type || 'N/A',
        price: booking.roomId?.price || 0,
        status: booking.roomId?.status || 'N/A',
        totalGuests: booking.roomId?.totalGuests || 0
      },
      amount: booking.totalAmount,
      status: booking.status.toLowerCase(),
      arrivalDate: booking.checkIn,
      departureDate: booking.checkOut,
      created_by: {
        _id: booking.userId?._id,
        name: booking.userId?.name || 'N/A',
        email: booking.userId?.email || 'N/A',
        phone: booking.userId?.phone || 'N/A'
      },
      updated_by: booking.userId?.email || 'N/A',
      paymentMethod: booking.paymentMethod?.toLowerCase(),
      paymentDetails: {
        status: booking.status === 'CONFIRMED' ? 'paid' : 'pending',
        paidAt: booking.status === 'CONFIRMED' ? booking.createdAt : null
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Combine and sort all orders
    const allOrders = [...bookingOrders];
    allOrders.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const total = allOrders.length;
    const paginatedOrders = allOrders.slice(skip, skip + itemsPerPage);

    // Transform for frontend
    const transformedOrders = paginatedOrders.map(order => ({
      ...order,
      checkIn: order.arrivalDate,
      checkOut: order.departureDate,
      createdBy: order.created_by,
      customer: {
        name: order.receiver,
        email: order.created_by?.email || order.updated_by,
        phone: order.created_by?.phone || 'N/A'
      },
      paymentStatus: order.paymentDetails?.status || (order.status === 'confirmed' ? 'paid' : 'unpaid')
    }));

    console.log('Transformed orders:', JSON.stringify(transformedOrders.map(o => ({
      id: o._id,
      orderNo: o.orderNo,
      customer: o.customer,
      status: o.status
    })), null, 2));

    const response = {
      data: transformedOrders,
      currentPage: Math.min(currentPage, Math.ceil(total / itemsPerPage)),
      totalPages: Math.ceil(total / itemsPerPage),
      total,
      limit: itemsPerPage
    };

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

const updateOrderStatus = async ({ orderId, status, updatedBy }) => {
  try {
    console.log('Updating order status:', { orderId, status, updatedBy });

    // First try to update booking if it exists
    const booking = await require('../bookings/booking.model').findById(orderId);
    if (booking) {
      // Convert status to uppercase for bookings
      const bookingStatus = status.toUpperCase();
      if (!['PENDING', 'CONFIRMED', 'CANCELLED'].includes(bookingStatus)) {
        throw new Error('Invalid booking status');
      }

      const updatedBooking = await require('../bookings/booking.model')
        .findByIdAndUpdate(
          orderId,
          { 
            status: bookingStatus,
            updatedAt: new Date()
          },
          { new: true }
        )
        .populate('roomId', 'name type price status totalGuests')
        .populate('userId', 'name email phone');

      if (!updatedBooking) {
        throw new Error('Booking not found');
      }

      console.log('Updated booking:', updatedBooking);
      return {
        success: true,
        message: 'Booking status updated successfully'
      };
    }

    // If not a booking, try to update order
    const order = await Model.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status for orders
    if (!['unpaid', 'confirmed', 'cancelled', 'completed'].includes(status.toLowerCase())) {
      throw new Error('Invalid order status');
    }

    const updatedOrder = await Model.findByIdAndUpdate(
      orderId,
      { 
        status: status.toLowerCase(),
        updated_by: updatedBy,
        'paymentDetails.status': status.toLowerCase() === 'confirmed' ? 'paid' : 'pending',
        'paymentDetails.paidAt': status.toLowerCase() === 'confirmed' ? new Date() : null
      },
      { new: true }
    ).populate([
      {
        path: 'room',
        select: 'name type price status totalGuests'
      },
      {
        path: 'created_by',
        select: 'name email phone'
      }
    ]);

    console.log('Updated order:', updatedOrder);
    return {
      success: true,
      message: 'Order status updated successfully'
    };

  } catch (error) {
    console.error('Error updating order status:', error);
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
