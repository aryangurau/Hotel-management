const { number } = require("joi");
const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    // userId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: { type: [String], enum: ["admin", "user"], default: ["user"] },
    isActive: { type: Boolean, required: true, default: false },
    isBlocked: { type: Boolean, required: true, default: false },
    token: String,
    created_by: String,
    updated_by: String, //TODO CHANGE
  },
  {
    timestamps: true,
  }
);

module.exports = new model("User", schema);
