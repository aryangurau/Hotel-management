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
const forgetpasswordschema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .required(),

  newPassword: Joi.string().required(),
  token: Joi.string().min(6).max(6).required(),
});

const validate = async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (err) {
    const errorMessage = err.details[0]?.message || "Validation error";
    res.status(400).json({ error: errorMessage });
  }
};

const forgetPasswordvalidation = async (req, res, next) => {
  try {
    await forgetpasswordschema.validateAsync(req.body);
    next();
  } catch (err) {
    const errorMessage = err.details[0]?.message || "Validation error";
    res.status(400).json({ error: errorMessage });
  }
};
module.exports = { validate, forgetPasswordvalidation };
