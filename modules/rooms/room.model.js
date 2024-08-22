const { boolean } = require("joi");
const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const roomSchema = new Schema(
  {
    roomNo: { type: Number, required: true, unique: true },
    roomPrice: { type: Number, required: true, default: 1000 },
    isFilled: { type: Boolean, default: false },
    isBooked: { type: Boolean, default: false },
    isEmpty: { type: Boolean, default: false },
    roomStatus: { type: String, default: false },
    isPetAllowed: { type: Boolean, default: false },

    roomType: {
      type: String,
      enum: ["single", "double", "suite"],
      default: "single",
    },

    roomCapacity: String,
    created_by: ObjectId,
    updated_by: ObjectId,
  },
  {
    timestamps: true,
  }
);

const roomModel = new model("Room", roomSchema);
module.exports = roomModel;
