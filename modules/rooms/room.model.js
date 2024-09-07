const { boolean } = require("joi");
const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const roomSchema = new Schema(
  {
    roomNo: { type: Number, required: true, unique: true },
    roomImage: String,
    created_by: ObjectId,
    updated_by: ObjectId,
    roomType: {
      type: String,
      enum: ["single", "double", "suite"],
      default: "single",
    },
    roomPrice: {
      type: Number,
      required: true,
      // min: [750, "Minimum room price is 750"],
      // max: [10000, "Minimum room price is 10000"], //TODO......joi validation
    },
    // isFilled: { type: Boolean, default: false },
    // isBooked: { type: Boolean, default: false },
    // isEmpty: { type: Boolean, default: false },

    roomStatus: {
      type: String,
      enum: ["isFilled", "isBooked", "isEmpty"],
      default: "isEmpty",
    },

    totalGuests: {
      type: Number,
      required: true,
      // min: [1, "Minimum accomodation is 1"],
      // max: [5, "Maximum accomodation is 5"], //TODO......joi validation
    },
  },
  {
    timestamps: true,
  }
);

const roomModel = new model("Room", roomSchema);
module.exports = roomModel;
