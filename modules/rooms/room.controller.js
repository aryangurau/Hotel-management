const Model = require("./room.model");

const publicRooms = () => {
  const room = Model.find({ roomStatus: "isEmpty" });
  if (!room) throw new Error("room not found");
  return Model.find({ roomStatus: "isEmpty" });
};
const PublicRoomInfo = async (id) => {
  // console.log(`Searching for roomNo: ${id}`); // Log the roomNo (id)
  // Query for the room with roomNo and roomStatus isEmpty in one go
  const room = await Model.findOne({ roomNo: id, roomStatus: "isEmpty" });
  // console.log("Query result:", room); // Log the query result
  // If no room is found, throw an error
  if (!room) {
    throw new Error("Room may be filled or booked ");
  } else {
    return room;
  }

  // If the room exists, return it
};
const list = async ({ filter, search, page = 1, limit = 10 }) => {
  let currentPage = +page;
  currentPage = currentPage < 1 ? 1 : currentPage;
  const { roomType } = search;

  const query = [];
  if (filter?.roomStatus) {
    query.push({ $match: { roomStatus: new RegExp(filter.roomStatus, "gi") } });
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
}; //TODO...
const getById = async (id) => {
  const room = await Model.findOne({ roomNo: id });
  if (!room) throw new Error("room not found");
  return await Model.findOne({ roomNo: id });
};
const createRoom = async (payload) => {
  const { created_by, updated_by, ...rest } = payload;
  rest.created_by = updated_by;
  return await Model.create(rest);
};

const updateById = async ({ id, payload }) => {
  // console.log(`searching for roomNo ${id}`)
  const room = await Model.findOne({ roomNo: id });

  if (!room) throw new Error("room not found ");
  return await Model.findOneAndUpdate({ roomNo: id }, payload, {
    runValidators: true,
    new: true,
  });
};

const updateStatus = async ({ id, payload }) => {
  console.log(`searching for roomNo ${id}`)

  const room = await Model.findOne({ roomNo: id });

  console.log("room", room)
  if (!room) throw new Error("room not found");
  return Model.findOneAndUpdate({ roomNo: id }, payload, {
    runValidators: true,
    new: true,
  });
};

const remove = async (id) => {
  const room = await Model.findOne({ roomNo: id });
  if (room.roomStatus !== "isEmpty") {
    throw new Error("Room is not empty. Please empty the room before deletion");
  }
  return await Model.findOneAndDelete({ roomNo: id });
};

// const updateFilledStatus = async ({ id, payload }) => {
//   const room = await Model.findOne({ roomNo: id });
//   if (!room) throw new Error("room not found");
//   const { isFilled } = room;
//   const updatedRoom = await Model.findOneAndUpdate(
//     { roomNo: id }, //Filter by room number
//     { isFilled: !isFilled, ...payload }, // Update the status // Update additional fields from the payload
//     { new: true, runValidators: true }
//   );
//   return {
//     data: { isFilled: updatedRoom?.isFilled },
//     msg: `Room is ${updatedRoom?.isFilled ? "filled" : "notFilled"} `,
//   };
// };
// const updateBookedStatus = async ({ id, payload }) => {
//   const room = await Model.findOne({ roomNo: id });
//   if (!room) throw new Error("room not found");
//   const { isBooked } = room;
//   const updatedRoom = await Model.findOneAndUpdate(
//     { roomNo: id }, //Filter by room number
//     { isBooked: !isBooked, ...payload }, // Update the status // Update additional fields from the payload
//     { new: true, runValidators: true }
//   );
//   return {
//     data: { isBooked: updatedRoom?.isBooked },
//     msg: `Room is ${updatedRoom?.isBooked ? "Booked" : "not Booked"} `,
//   };
// };
// const updateEmptyStatus = async ({ id, payload }) => {
//   const room = await Model.findOne({ roomNo: id });
//   if (!room) throw new Error("room not found");
//   const { isEmpty } = room;
//   const updatedRoom = await Model.findOneAndUpdate(
//     { roomNo: id }, //Filter by room number
//     { isEmpty: !isEmpty, ...payload }, // Update the status // Update additional fields from the payload
//     { new: true, runValidators: true }
//   );
//   return {
//     data: { isEmpty: updatedRoom?.isEmpty },
//     msg: `Room is ${updatedRoom?.isEmpty ? "Empty" : "not empty"} `,
//   };
// };
//  const roomStatus = async({id, payload})=>{
//           const room = await Model.findOne({roomNo:id})
//           if(!room) throw new Error("room not found")
//             const{isFilled,isBooked,isEmpty} = room
//           if(isFilled===true)

//  }

// const checkAllStatus = async ({ id, payload }) => {
//   const room = await Model.findOne({ roomNo: id });
//   if (!room) throw new Error("room not found");
//   const { isFilled, isBooked, isEmpty } = room;
//   const updatedRoom = await Model.findOneAndUpdate(
//     { roomNo: id },
//     { isFilled: isFilled, isBooked: isBooked, isEmpty: isEmpty },
//     { new: true }
//   );
//   return {
//     data: {
//       isFilled: updatedRoom?.isFilled,
//       isBooked: updatedRoom?.isBooked,
//       isEmpty: updatedRoom?.isEmpty,
//     },
//     msg: `Room is${updatedRoom?.isFilled ? "filled" : "not filled"}  ,Room is${
//       updatedRoom?.isBooked ? "Booked" : "not Booked"
//     }  ,Room is${updatedRoom?.isEmpty ? "empty" : "not empty"} `,
//   };
// };

module.exports = {
  publicRooms,
  createRoom,
  getById,
  PublicRoomInfo,
  updateById,
  list,
  remove,
  updateStatus,
  // updateFilledStatus,
  // updateBookedStatus,
  // updateEmptyStatus,
  // checkAllStatus,
};
