const Joi = require("joi");

const schema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .required(),

  password: Joi.string().optional(),
});

const validate = async (req, res, next) => {
  try {
    console.log("Request body:", req.body);
    await schema.validateAsync(req.body);
    next();
  } catch (err) {
    const errorMessage = err.details[0]?.message || "Validation error";
    res.status(400).json({ error: errorMessage });
  }
};

module.exports = { validate };
