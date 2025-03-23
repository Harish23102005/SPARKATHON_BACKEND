const validateStudentInput = (req, res, next) => {
  const { studentId, name, department, marks, courseOutcomes, coPoMapping } =
    req.body;

  if (
    !studentId ||
    !name ||
    !department ||
    !marks ||
    !courseOutcomes ||
    !coPoMapping
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (
    !marks[0].year ||
    !marks[0].internal ||
    !marks[0].exam ||
    !marks[0].totalInternal ||
    !marks[0].totalExam
  ) {
    return res.status(400).json({ error: "All marks fields are required" });
  }

  next();
};

const validateMarksUpdate = (req, res, next) => {
  const { marks, courseOutcomes } = req.body;

  if (!marks || !courseOutcomes) {
    return res
      .status(400)
      .json({ error: "Marks and course outcomes are required" });
  }

  if (
    !marks.year ||
    !marks.internal ||
    !marks.exam ||
    !marks.totalInternal ||
    !marks.totalExam
  ) {
    return res.status(400).json({ error: "All marks fields are required" });
  }

  next();
};

const validateSignup = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  next();
};

module.exports = { validateStudentInput, validateMarksUpdate, validateSignup };
