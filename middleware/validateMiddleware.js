const Joi = require("joi");

const validateSignup = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// Existing validation for student routes
const validateStudentInput = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().required(),
    name: Joi.string().required(),
    department: Joi.string().required(),
    marks: Joi.array().items(
      Joi.object({
        year: Joi.string().required(),
        internal: Joi.number().max(999.99).required(),
        exam: Joi.number().max(999.99).required(),
        totalInternal: Joi.number().max(999.99).required(),
        totalExam: Joi.number().max(999.99).required(),
        coMapping: Joi.array().items(
          Joi.object({
            coId: Joi.string().required(),
            internal: Joi.number().max(999.99).required(),
            exam: Joi.number().max(999.99).required(),
            totalInternal: Joi.number().max(999.99).required(),
            totalExam: Joi.number().max(999.99).required(),
          })
        ),
      })
    ),
    courseOutcomes: Joi.array().items(
      Joi.object({
        coId: Joi.string().required(),
        target: Joi.number().required(),
      })
    ),
    coPoMapping: Joi.array().items(
      Joi.object({
        coId: Joi.string().required(),
        poMapping: Joi.array().items(
          Joi.object({
            poId: Joi.string().required(),
            weight: Joi.number().required(),
          })
        ),
      })
    ),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateMarksUpdate = (req, res, next) => {
  const schema = Joi.object({
    marks: Joi.array().items(
      Joi.object({
        year: Joi.string().required(),
        internal: Joi.number().max(999.99).required(),
        exam: Joi.number().max(999.99).required(),
        totalInternal: Joi.number().max(999.99).required(),
        totalExam: Joi.number().max(999.99).required(),
        coMapping: Joi.array().items(
          Joi.object({
            coId: Joi.string().required(),
            internal: Joi.number().max(999.99).required(),
            exam: Joi.number().max(999.99).required(),
            totalInternal: Joi.number().max(999.99).required(),
            totalExam: Joi.number().max(999.99).required(),
          })
        ),
      })
    ),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateStudentInput,
  validateMarksUpdate,
};
