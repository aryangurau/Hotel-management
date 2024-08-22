const { model } = require("mongoose");
const Model = require("./room.model");

const createRoom = async (payload) => {
  const { created_by, updated_by, ...rest } = payload;
  rest.created_by = updated_by;
  return await Model.create(rest);
};

const getById = async (id) => {
  return await Model.findOne({ roomNo: id });
};

const updateById = async ({ id, payload }) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  return await Model.findOneAndUpdate({ roomNo: id }, payload, {
    runValidators: true,
    new: true,
  });
};
const updateFilledStatus = async ({ id, payload }) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  const { isFilled } = room;
  const updatedRoom = await Model.findOneAndUpdate(
    { roomNo: id }, //Filter by room number
    { isFilled: !isFilled, ...payload }, // Update the status // Update additional fields from the payload
    { new: true, runValidators: true }
  );
  return {
    data: { isFilled: updatedRoom?.isFilled },
    msg: `Room is ${updatedRoom?.isFilled ? "filled" : "notFilled"} `,
  };
};
const updateBookedStatus = async ({ id, payload }) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  const { isBooked } = room;
  const updatedRoom = await Model.findOneAndUpdate(
    { roomNo: id }, //Filter by room number
    { isBooked: !isBooked, ...payload }, // Update the status // Update additional fields from the payload
    { new: true, runValidators: true }
  );
  return {
    data: { isBooked: updatedRoom?.isBooked },
    msg: `Room is ${updatedRoom?.isBooked ? "Booked" : "not Booked"} `,
  };
};
const updateEmptyStatus = async ({ id, payload }) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  const { isEmpty } = room;
  const updatedRoom = await Model.findOneAndUpdate(
    { roomNo: id }, //Filter by room number
    { isEmpty: !isEmpty, ...payload }, // Update the status // Update additional fields from the payload
    { new: true, runValidators: true }
  );
  return {
    data: { isEmpty: updatedRoom?.isEmpty },
    msg: `Room is ${updatedRoom?.isEmpty ? "Empty" : "not empty"} `,
  };
};

const checkAllStatus = async ({ id, payload }) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  const { isFilled, isBooked, isEmpty } = room;
  const updatedRoom = await Model.findOneAndUpdate(
    { roomNo: id },
    { isFilled: isFilled, isBooked: isBooked, isEmpty: isEmpty },
    { new: true }
  );
  return {
    data: {
      isFilled: updatedRoom?.isFilled,
      isBooked: updatedRoom?.isBooked,
      isEmpty: updatedRoom?.isEmpty,
    },
    msg: `Room is${updatedRoom?.isFilled ? "filled" : "not filled"}  ,Room is${
      updatedRoom?.isBooked ? "Booked" : "not Booked"
    }  ,Room is${updatedRoom?.isEmpty ? "empty" : "not empty"} `,
  };
};

const list = async ({ filter, search, page = 1, limit = 10 }) => {
  let currentPage = +page;
  currentPage = currentPage < 1 ? 1 : currentPage;
  const { roomType } = search;
  const query = [];

  if (filter?.isFilled === "yes" || filter?.isFilled === "no") {
    query.push({
      $match: {
        isFilled: filter?.isFilled === "yes" ? true : false,
      },
    });
  }
  if (filter?.isBooked == "yes" || filter?.isBooked === "no") {
    query.push({
      $match: {
        isBooked: filter?.isBooked === "yes" ? true : false,
      },
    });
  }
  if (filter?.isEmpty == "yes" || filter?.isEmpty === "no") {
    query.push({
      $match: {
        isEmpty: filter?.isEmpty === "yes" ? true : false,
      },
    });
  }
  if (roomType) {
    query.push({ $match: { roomType: new RegExp(roomType, "gi") } });
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
const remove = async () => {};

module.exports = {
  createRoom,
  getById,
  updateById,
  // updateStatus,
  list,
  remove,
  updateFilledStatus,
  updateBookedStatus,
  updateEmptyStatus,
  checkAllStatus,
};
