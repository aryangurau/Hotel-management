const Model = require("./order.model");
const Room = require("../rooms/room.model");

const create = (payload) => {
  const { updated_by, ...rest } = payload;
  rest.created_by = updated_by;
  return Model.create(rest);
};

const getByOrderNumber = (orderNo, filter) => {
  return Model.findOne({ number: orderNo, ...filter });
};
const list = async ({ filter, search, page = 1, limit = 10 }) => {
  let currentPage = +page;
  currentPage = currentPage < 1 ? 1 : currentPage;
  const { number } = search;

  const query = [];
  if (filter?.status) {
    query.push({ $match: { roomStatus: new RegExp(filter.roomStatus, "gi") } });
  }
  if (number) {
    query.push({ $match: { number: new RegExp(number, "gi") } });
  }

  query.push(
    {
      $lookup: {
        from: "rooms",
        localField: "room",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $unwind: {
        path: "$room",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $facet: {
        metadata: [
          {
            $count: "total",
          },
        ],
        data: [
          {
            $skip: 0,
          },
          {
            $limit: 2,
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

  const result = await Model.aggregate(query);
  return {
    data: result[0]?.data,
    page: +currentPage,
    limit: +limit,
    total: result[0]?.total || 0,
  };
};
const updateOrder = async (orderNo, payload) => {
  console.log("orderNo", orderNo);
  const { room, number, ...rest } = payload;
  if (room) {
    const roomExists = await Room.findById(room);
    if (!roomExists) {
      throw new Error("Room not found in order");
    }
  }
  return Model.findOneAndUpdate({ number: orderNo }, rest, { new: true });
};
const updateOrderStatus = async (orderNo, updatedBy) => {
  // Find the order by the order number
  const order = await Model.findOne({ number: orderNo });

  // Check if the order exists
  if (!order) throw new Error("No order found");

  // Toggle the order status between 'paid' and 'unpaid'
  const newStatus = order.status === "paid" ? "unpaid" : "paid";

  // Update the order with the new status and who updated it
  const updatedOrder = await Model.findOneAndUpdate(
    { number: orderNo },
    { status: newStatus, updated_by: updatedBy },
    { new: true }
  );

  // Return updated information
  return {
    data: { status: updatedOrder?.status },
    msg: `Order is ${updatedOrder?.status === "paid" ? "paid" : "unpaid"} `,
  };

  //   if(order?.status==="paid")
  //   const payload = {
  //     status: order?.status === "paid" ? "unpaid" : "paid",
  //   };
  //   return Model.findOneAndUpdate({ number: orderNo }, payload, { new: true });
};
const removeOrder = async (orderNo) => {
  const order = await Model.findOne({ number: orderNo });
  if (order.status == "paid")
    throw new Error("Order is paid, refund before deletion");
  return Model.deleteOne({ number: orderNo });
};

module.exports = {
  create,
  getByOrderNumber,
  list,
  updateOrder,
  updateOrderStatus,
  removeOrder,
};
