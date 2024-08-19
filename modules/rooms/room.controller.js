const Model = require("./room.model");

const createRoom = async (payload) => {
  const { created_by, updated_by, ...rest } = payload;
  rest.created_by = updated_by;
  return await Model.create(rest);
};

module.exports = { createRoom };
