const Joi = require("joi");

const roomSchema = Joi.object({
  roomNo: Joi.number().required().messages({
    "number.base": "Room number must be a number.",
    "any.required": "Room number is a required field.",
  }),
  roomStatus: Joi.string()
    .valid("isFilled", "isBooked", "isEmpty")
    .required()
    .messages({
      "any.only":
        "Room status must be one of 'isFilled', 'isBooked', or 'isEmpty'.",
      "any.required": "Room status is a required field.",
    }),
  roomType: Joi.string()
    .valid("single", "double", "suite")
    .required()
    .messages({
      "any.only": "Room type must be one of 'single', 'double', or 'suite'.",
      "any.required": "Room type is a required field.",
    }),
  roomPrice: Joi.number().min(750).max(10000).required().messages({
    "number.min": "Minimum room price is 750.",
    "number.max": "Maximum room price is 10000.",
    "any.required": "Room price is a required field.",
  }),
  totalGuests: Joi.number().min(1).max(5).required().messages({
    "number.min": "Minimum accommodation is 1 guest.",
    "number.max": "Maximum accommodation is 5 guests.",
    "any.required": "Total guests is a required field.",
  }),
});

const roomValidation = async (req, res, next) => {
  try {
    await roomSchema.validateAsync(req.body);
    next();
  } catch (err) {
    const errorMessage = err.details[0]?.message || "Validation error";
    res.status(400).json({ error: errorMessage });
  }
};

const statusSchema = Joi.object({
  roomNo: Joi.number().required().messages({
    "number.base": "Room number must be a number.",
    "any.required": "Room number is a required field.",
  }),
  roomStatus: Joi.string()
    .valid("isFilled", "isBooked", "isEmpty")
    .required()
    .messages({
      "any.only":
        "Room status must be one of 'isFilled', 'isBooked', or 'isEmpty'.",
      "any.required": "Room status is a required field.",
    }),
});

const statusValidation = async (req, res, next) => {
  try {
    await statusSchema.validateAsync(req.body);
    next();
  } catch (err) {
    const errorMessage = err.details[0]?.message || "Validation error";
    res.status(400).json({ error: errorMessage });
  }
};

// const priceSchema = Joi.object({
//   roomPrice: Joi.number().min(750).max(10000).required().messages({
//     "number.base": "Room price must be a number",
//     "number.min": "Minimum room price is 750",
//     "number.max": "Maximum room price is 10000",
//     "any.required": "Room price is required",
//   }),
// });

// const priceValidation = async (req, res, next) => {
//   try {
//     await priceSchema.validateAsync(req.body);
//     next();
//   } catch (err) {
//     const errorMessage = err.details[0]?.message || "Validation error";
//     res.status(400).json({ error: errorMessage });
//   }
// };

// const roomStatusSchema = Joi.object({
//   roomStatus: Joi.string()
//     .valid("isFilled", "isBooked", "isEmpty")
//     .default("isEmpty"),
// });

// const statusValidation = async (req, res, next) => {
//   try {
//     await roomStatusSchema.validateAsync(req.body);
//     next();
//   } catch (err) {
//     const errorMessage = err.details[0]?.message || "Validation error";
//     res.status(400).json({ error: errorMessage });
//   }
// };

// const guestsSchema = Joi.object({
//   totalGuests: Joi.number().min(1).max(5).required().messages({
//     "number.base": "Total guests must be a number.",
//     "number.min": "Minimum accommodation is 1 guest.",
//     "number.max": "Maximum accommodation is 5 guests.",
//     "any.required": "Total guests is a required field.",
//   }),
// });
// const guestValidation = async (req, res, next) => {
//   try {
//     await guestsSchema.validateAsync(req.body);
//     next();
//   } catch (err) {
//     const errorMessage = err.details[0]?.message || "Validation error";
//     res.status(400).json({ error: errorMessage });
//   }
// };
// module.exports = { priceValidation, statusValidation, guestValidation };
module.exports = { roomValidation, statusValidation };
