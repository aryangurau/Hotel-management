const Model = require("./room.model");

const create = (payload) => {
  const { updated_by, ...rest } = payload;
  rest.created_by = updated_by;
  return Model.create(rest);
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

const getById = (id) => {
  return Model.findOne({ _id: id });
};

const publicRoomInfo = (number) => {
  return Model.findOne({ name: new RegExp(number, "gi"), status: "empty" });
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
  updateById,
  updateStatus,
  remove,
};
