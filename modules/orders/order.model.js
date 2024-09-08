const { required } = require("joi");
const { randomUUID } = require("crypto");
const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

const orderSchema = new Schema(
  {
    // todo...
    number: {
      type: String,
      default: () => String(randomUUID()),
      required: true,
    }, // todo
    receiver: { type: String, required: true },
    arrivalDate: { type: Date, required: true },
    departureDate: { type: Date, required: true },
    room: { type: ObjectId, ref: "Room", required: true },
    status: { type: String, enum: ["paid", "unpaid", "refund"], default: "unpaid" }, // todo
    amount: { type: Number, required: true },
    created_by: { type: ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = new model("Order", orderSchema);
