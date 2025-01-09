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

const list = async ({ filter, search, page = 1, limit = 10 }) => {
  try {
    console.log('List orders with filter:', JSON.stringify(filter, null, 2));
    let currentPage = +page;
    currentPage = currentPage < 1 ? 1 : currentPage;
    const skip = (currentPage - 1) * limit;

    // Build match conditions
    const matchConditions = {};
    if (filter?.status) {
      matchConditions.status = filter.status;
    }
    if (filter?.updated_by) {
      matchConditions.updated_by = filter.updated_by;
    }
    if (search?.orderNo) {
      matchConditions.orderNo = new RegExp(search.orderNo, "i");
    }
    // Also check for legacy 'number' field
    if (search?.number) {
      matchConditions.number = new RegExp(search.number, "i");
    }

    console.log('Final match conditions:', JSON.stringify(matchConditions, null, 2));

    // Get total count
    const total = await Model.countDocuments(matchConditions);
    console.log('Total matching documents:', total);

    if (total === 0) {
      console.log('No orders found with these conditions');
      return {
        data: [],
        currentPage: 1,
        totalPages: 0,
        total: 0
      };
    }

    const pipeline = [
      {
        $match: matchConditions
      },
      {
        $lookup: {
          from: "rooms",
          localField: "room",
          foreignField: "_id",
          as: "roomDetails"
        }
      },
      {
        $lookup: {
          from: "hotels",
          localField: "roomDetails.hotel",
          foreignField: "_id",
          as: "hotelDetails"
        }
      },
      {
        $addFields: {
          roomDetails: {
            $cond: {
              if: { $eq: [{ $size: "$roomDetails" }, 0] },
              then: [{}],
              else: "$roomDetails"
            }
          },
          hotelDetails: {
            $cond: {
              if: { $eq: [{ $size: "$hotelDetails" }, 0] },
              then: [{}],
              else: "$hotelDetails"
            }
          }
        }
      },
      {
        $unwind: {
          path: "$roomDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: "$hotelDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          orderNo: { $ifNull: ["$orderNo", "$number"] }, // Use number if orderNo doesn't exist
          hotelName: { $ifNull: ["$hotelDetails.name", "N/A"] },
          roomNumber: { $ifNull: ["$roomDetails.roomNumber", "N/A"] },
          roomType: { $ifNull: ["$roomDetails.roomType", "N/A"] },
          totalGuests: { $ifNull: ["$roomDetails.totalGuests", 0] }
        }
      },
      {
        $project: {
          _id: 1,
          orderNo: 1,
          receiver: 1,
          amount: 1,
          status: 1,
          arrivalDate: 1,
          departureDate: 1,
          updated_by: 1,
          created_at: 1,
          hotelName: 1,
          roomNumber: 1,
          roomType: 1,
          paymentMethod: 1,
          totalGuests: 1
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: +limit
      }
    ];

    console.log('Running aggregation pipeline');
    const orders = await Model.aggregate(pipeline);
    console.log('Found orders after aggregation:', orders.length);
    console.log('Sample order from aggregation:', orders[0] ? JSON.stringify(orders[0], null, 2) : 'None');

    const totalPages = Math.ceil(total / limit);

    const result = {
      data: orders,
      currentPage,
      totalPages,
      total
    };

    console.log('Returning result:', JSON.stringify({
      ordersCount: orders.length,
      currentPage,
      totalPages,
      total
    }, null, 2));

    return result;
  } catch (error) {
    console.error('Error in list orders:', error);
    throw new Error('Failed to fetch orders: ' + error.message);
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
