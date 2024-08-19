const { Schema, model } = require("mongoose");

const roomSchema = new Schema(
  {
    roomNo: { type: Number, required: true, unique: true },
    isFilled: { type: Boolean, default: false },
    roomStatus: { type: String, default: false },
    isPetAllowed: { type: Boolean, default: false },
    roomType: {
      type: String,
      enum: ["single", "double", "suite"],
      default: "single",
    },
    created_by: String,
    updated_by: String,
  },
  {
    timestamps: true,
  }
);

const roomModel = new model("Room", roomSchema);
module.exports = roomModel;
