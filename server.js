require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const xlsx = require("xlsx");

// Initialize express app
const app = express();

// Middleware
// Update CORS to allow only your Netlify frontend in production
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];

// Log the allowed origins for debugging
console.log("Allowed Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Log the incoming origin for debugging
      console.log("Incoming Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(
          `CORS Error: Origin ${origin} not allowed. Allowed origins: ${allowedOrigins}`
        );
        callback(new Error(`CORS policy: Origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow these HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
    credentials: true, // Allow credentials (if needed, e.g., for cookies or auth headers)
  })
);

// Handle preflight requests explicitly (optional, but recommended for clarity)
app.options("*", cors()); // Respond to all OPTIONS requests
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import routes (fix duplicate import)
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");

// Routes
app.use("/api", authRoutes);
app.use("/api/students", studentRoutes);

// Import database and models
const sequelize = require("./config/database");
const { User } = require("./models");

// Function to map percentage to CO level (1 to 3)
const mapPercentageToLevel = (percentage) => {
  if (percentage >= 70) return 3; // Level 3 for >= 70%
  if (percentage >= 60) return 2; // Level 2 for >= 60%
  return 1; // Level 1 for < 60%
};

// Endpoint for calculating semester CO/PO and storing the result
app.post(
  "/api/upload-semester-results",
  upload.fields([
    { name: "internal", maxCount: 1 },
    { name: "assignment", maxCount: 1 },
    { name: "classTest", maxCount: 1 },
    { name: "semester", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Received upload request");

      // Check if files are present
      if (
        !req.files ||
        !req.files.internal ||
        !req.files.assignment ||
        !req.files.classTest ||
        !req.files.semester
      ) {
        console.error("Missing required files");
        return res.status(400).json({
          error:
            "All files (internal, assignment, classTest, semester) are required",
        });
      }

      // Parse the uploaded Excel files
      console.log("Parsing Internal file...");
      const internalWb = xlsx.read(req.files.internal[0].buffer, {
        type: "buffer",
      });
      console.log("Parsing Assignment file...");
      const assignmentWb = xlsx.read(req.files.assignment[0].buffer, {
        type: "buffer",
      });
      console.log("Parsing Class Test file...");
      const classTestWb = xlsx.read(req.files.classTest[0].buffer, {
        type: "buffer",
      });
      console.log("Parsing Semester file...");
      const semesterWb = xlsx.read(req.files.semester[0].buffer, {
        type: "buffer",
      });

      // Log the sheet names to verify structure
      console.log("Internal Workbook Sheet Names:", internalWb.SheetNames);
      console.log("Assignment Workbook Sheet Names:", assignmentWb.SheetNames);
      console.log("Class Test Workbook Sheet Names:", classTestWb.SheetNames);
      console.log("Semester Workbook Sheet Names:", semesterWb.SheetNames);

      // Validate sheet structure
      const requiredColumns = {
        internal: ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"],
        assignment: ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"],
        classTest: ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"],
        semester: ["Mark"],
      };

      // Process only the first 3 sheets for internal, 3 for assignment, 2 for class test, 1 for semester
      const internalSheets = internalWb.SheetNames.slice(0, 3).map(
        (sheetName) => xlsx.utils.sheet_to_json(internalWb.Sheets[sheetName])
      );
      const assignmentSheets = assignmentWb.SheetNames.slice(0, 3).map(
        (sheetName) => xlsx.utils.sheet_to_json(assignmentWb.Sheets[sheetName])
      );
      const classTestSheets = classTestWb.SheetNames.slice(0, 2).map(
        (sheetName) => xlsx.utils.sheet_to_json(classTestWb.Sheets[sheetName])
      );
      const semesterSheets = semesterWb.SheetNames.slice(0, 1).map(
        (sheetName) => xlsx.utils.sheet_to_json(semesterWb.Sheets[sheetName])
      );

      // Validate data
      if (
        internalSheets.length === 0 ||
        internalSheets.every((sheet) => sheet.length === 0)
      ) {
        return res.status(400).json({ error: "Internal file is empty" });
      }
      if (
        assignmentSheets.length === 0 ||
        assignmentSheets.every((sheet) => sheet.length === 0)
      ) {
        return res.status(400).json({ error: "Assignment file is empty" });
      }
      if (
        classTestSheets.length === 0 ||
        classTestSheets.every((sheet) => sheet.length === 0)
      ) {
        return res.status(400).json({ error: "Class Test file is empty" });
      }
      if (semesterSheets.length === 0 || semesterSheets[0].length === 0) {
        return res.status(400).json({ error: "Semester file is empty" });
      }

      console.log("Internal Sheets Count:", internalSheets.length);
      console.log("Assignment Sheets Count:", assignmentSheets.length);
      console.log("Class Test Sheets Count:", classTestSheets.length);
      console.log("Semester Sheets Count:", semesterSheets.length);

      // Initialize CO attainment object
      const coAttainment = {
        internal1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        internal2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        internal3: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        internalAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        assignment1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        assignment2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        assignment3: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        assignmentAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        classTest1: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        classTest2: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        classTestAvg: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        seminar: { CO1: 3.0, CO2: 3.0, CO3: 3.0, CO4: 3.0, CO5: 3.0, CO6: 3.0 },
        workProject: {
          CO1: 3.0,
          CO2: 3.0,
          CO3: 3.0,
          CO4: 3.0,
          CO5: 3.0,
          CO6: 3.0,
        },
        cia: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        see: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        direct: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        indirect: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
        overall: { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 },
      };

      const targetAttained = {
        CO1: false,
        CO2: false,
        CO3: false,
        CO4: false,
        CO5: false,
        CO6: false,
      };

      // Define static parameters as per the image
      const parameters = {
        x: 0.8, // Weight for external attainment
        y: 0.2, // Weight for internal attainment
        u: 0.9, // Weight for direct attainment
        v: 0.1, // Weight for indirect attainment
        targetAttainmentLevel: 2.6, // Target level as per the image
      };

      // Process Internal Assessments (Internal 1, 2, 3)
      console.log("Processing Internal Assessments...");

      // Maximum marks based on the analysis
      const internalMaxMarks = {
        internal1: { CO1: 88, CO2: 62, CO3: 0, CO4: 0, CO5: 0, CO6: 30 },
        internal2: { CO1: 0, CO2: 0, CO3: 103, CO4: 77, CO5: 0, CO6: 0 },
        internal3: { CO1: 30, CO2: 45, CO3: 30, CO4: 30, CO5: 28, CO6: 17 },
      };
      console.log("Internal Max Marks:", internalMaxMarks);

      // Process each internal sheet (up to 3)
      for (let i = 1; i <= 3; i++) {
        if (i > internalSheets.length || internalSheets[i - 1].length === 0) {
          // If the sheet is missing, set to "-"
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            coAttainment[`internal${i}`][coId] = "-";
          }
          console.log(`Internal ${i}: Missing sheet, set to "-"`);
          continue;
        }

        const internalData = internalSheets[i - 1];
        const internalScores = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        const studentsAbove60 = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        let studentCount = 0;

        console.log(
          `Processing Internal ${i}, Data Length: ${internalData.length}`
        );

        for (let j = 0; j < internalData.length; j++) {
          console.log(`Student ${j + 1} Data:`, internalData[j]);
          const percentages = {};
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            let coTotal = 0;
            for (let col in internalData[j]) {
              if (col.startsWith(coId)) {
                // Skip specific columns as per original code
                if (i === 2 && coId === "CO3" && col === "CO3.11") continue;
                if (i === 2 && coId === "CO4" && col === "CO4.9") continue;
                if (i === 3 && coId === "CO2" && col === "CO2.4") continue;
                if (i === 3 && coId === "CO6" && col === "CO6.1") continue;
                const marks = Number(internalData[j][col]) || 0;
                coTotal += marks;
              }
            }
            const maxMarks = internalMaxMarks[`internal${i}`][coId];
            percentages[coId] = maxMarks > 0 ? (coTotal / maxMarks) * 100 : 0;
            if (percentages[coId] >= 60) {
              studentsAbove60[coId]++;
            }
            console.log(
              `Internal ${i}, Student ${
                j + 1
              }, ${coId}: Total Marks=${coTotal}, Max Marks=${maxMarks}, Percentage=${percentages[
                coId
              ].toFixed(2)}%`
            );
          }
          studentCount++;
        }

        console.log(`Internal ${i} Student Count: ${studentCount}`);
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          const percentageAbove60 =
            studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
          const level = mapPercentageToLevel(percentageAbove60);
          coAttainment[`internal${i}`][coId] =
            internalMaxMarks[`internal${i}`][coId] > 0 ? level : "-";
          console.log(
            `Internal ${i}, ${coId}: Students Above 60%=${
              studentsAbove60[coId]
            }, Percentage Above 60%=${percentageAbove60.toFixed(2)}%, Level=${
              coAttainment[`internal${i}`][coId]
            }`
          );
        }
      }

      // Calculate Internal Average, excluding COs with max marks of 0 or "-"
      console.log("Calculating Internal Average...");
      const internalAverage = {
        CO1: 0,
        CO2: 0,
        CO3: 0,
        CO4: 0,
        CO5: 0,
        CO6: 0,
      };
      const internalCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 };

      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        let totalLevel = 0;
        let count = 0;

        for (let i = 1; i <= 3; i++) {
          const level = coAttainment[`internal${i}`][coId];
          if (level !== "-" && internalMaxMarks[`internal${i}`][coId] > 0) {
            totalLevel += level;
            count++;
          }
        }

        internalAverage[coId] = count > 0 ? totalLevel / count : 0;
        internalCounts[coId] = count;
        coAttainment.internalAvg[coId] = count > 0 ? internalAverage[coId] : 0;
        console.log(
          `Internal Average ${coId}: Total Level=${totalLevel}, Count=${count}, Average=${coAttainment.internalAvg[
            coId
          ].toFixed(2)}`
        );
      }

      // Process Assignments (Assignment 1, 2, 3) - Calculate individual levels
      console.log("Processing Assignments...");
      for (let i = 1; i <= 3; i++) {
        if (
          i > assignmentSheets.length ||
          assignmentSheets[i - 1].length === 0
        ) {
          // If the sheet is missing, set to "-"
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            coAttainment[`assignment${i}`][coId] = "-";
          }
          console.log(`Assignment ${i}: Missing sheet, set to "-"`);
          continue;
        }

        const assignmentData = assignmentSheets[i - 1];
        let assignmentMaxMarks = 10; // Default max marks
        const assignmentTotals = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        const studentsAbove60 = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        let studentCount = 0;

        for (let j = 0; j < assignmentData.length; j++) {
          const percentages = {};
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            const marks = Number(assignmentData[j][coId]) || 0;
            assignmentTotals[coId] += marks;
            if (marks > assignmentMaxMarks) {
              assignmentMaxMarks = marks;
            }
            percentages[coId] = (marks / assignmentMaxMarks) * 100;
            if (percentages[coId] >= 60) {
              studentsAbove60[coId]++;
            }
          }
          studentCount++;
        }

        console.log(`Assignment ${i} Student Count: ${studentCount}`);
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          const percentageAbove60 =
            studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
          const level = mapPercentageToLevel(percentageAbove60);
          coAttainment[`assignment${i}`][coId] = level;
          console.log(
            `Assignment ${i}, ${coId}: Students Above 60%=${
              studentsAbove60[coId]
            }, Percentage Above 60%=${percentageAbove60.toFixed(2)}%, Level=${
              coAttainment[`assignment${i}`][coId]
            }`
          );
        }
      }

      // Calculate Assignment Average
      console.log("Calculating Assignment Average...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        let totalLevel = 0;
        let count = 0;

        for (let i = 1; i <= 3; i++) {
          const level = coAttainment[`assignment${i}`][coId];
          if (level !== "-") {
            totalLevel += level;
            count++;
          }
        }

        coAttainment.assignmentAvg[coId] = count > 0 ? totalLevel / count : 0;
        console.log(
          `Assignment Average ${coId}: Total Level=${totalLevel}, Count=${count}, Average=${coAttainment.assignmentAvg[
            coId
          ].toFixed(2)}`
        );
      }

      // Process Class Tests (Class Test 1, 2) - Calculate individual levels
      console.log("Processing Class Tests...");
      for (let i = 1; i <= 2; i++) {
        if (i > classTestSheets.length || classTestSheets[i - 1].length === 0) {
          // If the sheet is missing, set to "-"
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            coAttainment[`classTest${i}`][coId] = "-";
          }
          console.log(`Class Test ${i}: Missing sheet, set to "-"`);
          continue;
        }

        const classTestData = classTestSheets[i - 1];
        let classTestMaxMarks = 10; // Default max marks
        const classTestTotals = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        const studentsAbove60 = {
          CO1: 0,
          CO2: 0,
          CO3: 0,
          CO4: 0,
          CO5: 0,
          CO6: 0,
        };
        let studentCount = 0;

        for (let j = 0; j < classTestData.length; j++) {
          const percentages = {};
          for (let k = 1; k <= 6; k++) {
            const coId = `CO${k}`;
            const marks = Number(classTestData[j][coId]) || 0;
            classTestTotals[coId] += marks;
            if (marks > classTestMaxMarks) {
              classTestMaxMarks = marks;
            }
            percentages[coId] = (marks / classTestMaxMarks) * 100;
            if (percentages[coId] >= 60) {
              studentsAbove60[coId]++;
            }
          }
          studentCount++;
        }

        console.log(`Class Test ${i} Student Count: ${studentCount}`);
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          const percentageAbove60 =
            studentCount > 0 ? (studentsAbove60[coId] / studentCount) * 100 : 0;
          const level = mapPercentageToLevel(percentageAbove60);
          coAttainment[`classTest${i}`][coId] = level;
          console.log(
            `Class Test ${i}, ${coId}: Students Above 60%=${
              studentsAbove60[coId]
            }, Percentage Above 60%=${percentageAbove60.toFixed(2)}%, Level=${
              coAttainment[`classTest${i}`][coId]
            }`
          );
        }
      }

      // Calculate Class Test Average
      console.log("Calculating Class Test Average...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        let totalLevel = 0;
        let count = 0;

        for (let i = 1; i <= 2; i++) {
          const level = coAttainment[`classTest${i}`][coId];
          if (level !== "-") {
            totalLevel += level;
            count++;
          }
        }

        coAttainment.classTestAvg[coId] = count > 0 ? totalLevel / count : 0;
        console.log(
          `Class Test Average ${coId}: Total Level=${totalLevel}, Count=${count}, Average=${coAttainment.classTestAvg[
            coId
          ].toFixed(2)}`
        );
      }

      // Calculate CIA (20%)
      console.log("Calculating CIA...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const internalAvg = coAttainment.internalAvg[coId];
        const assignmentAvg = coAttainment.assignmentAvg[coId];
        const classTestAvg = coAttainment.classTestAvg[coId];
        // Weights: Internal 50%, Assignment 30%, Class Test 20%
        const ciaValue =
          (internalAvg > 0 ? internalAvg : 0) * 0.5 +
          (assignmentAvg > 0 ? assignmentAvg : 0) * 0.3 +
          (classTestAvg > 0 ? classTestAvg : 0) * 0.2;
        coAttainment.cia[coId] = Math.min(Math.max(ciaValue, 1), 3);
        console.log(
          `CIA, ${coId}: Internal=${internalAvg}, Assignment=${assignmentAvg}, Class Test=${classTestAvg}, CIA Value=${coAttainment.cia[
            coId
          ].toFixed(2)}`
        );
      }

      // Process Semester Results (SEE - 80%)
      console.log("Processing Semester Results...");
      const semesterScores = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0, CO6: 0 };
      const coMapping = {
        CO1: [
          "CO1",
          "CO1.1",
          "CO1.2",
          "CO1.3",
          "CO1.4",
          "CO1.5",
          "CO1.6",
          "CO1.7",
          "CO1.8",
          "CO1.9",
          "CO1.10",
        ],
        CO2: [
          "CO2",
          "CO2.1",
          "CO2.2",
          "CO2.3",
          "CO2.4",
          "CO2.5",
          "CO2.6",
          "CO2.7",
          "CO2.8",
          "CO2.9",
        ],
        CO3: ["CO3"],
        CO4: ["CO4"],
        CO5: ["CO5"],
        CO6: ["CO6"],
      };
      let studentCount = 0;

      const semesterData = semesterSheets[0];
      for (let i = 0; i < semesterData.length; i++) {
        const total = Number(semesterData[i]["Mark"]) || 0;
        const percentage = (total / 100) * 100; // Assuming max marks for SEE is 100
        const level = mapPercentageToLevel(percentage);
        for (let k = 1; k <= 6; k++) {
          const coId = `CO${k}`;
          if (coMapping[coId]) {
            semesterScores[coId] += level;
          }
        }
        studentCount++;
      }

      console.log("Semester Student Count:", studentCount);
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        if (coMapping[coId]) {
          const seeValue =
            studentCount > 0 ? semesterScores[coId] / studentCount : 0;
          coAttainment.see[coId] = Math.min(Math.max(seeValue, 1), 3);
          console.log(`SEE, ${coId}: ${coAttainment.see[coId].toFixed(2)}`);
        }
      }

      // Calculate Direct Attainment (x * External + y * Internal)
      console.log("Calculating Direct Attainment...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const directValue =
          coAttainment.cia[coId] * parameters.y +
          coAttainment.see[coId] * parameters.x;
        coAttainment.direct[coId] = Math.min(Math.max(directValue, 1), 3);
        console.log(`Direct, ${coId}: ${coAttainment.direct[coId].toFixed(2)}`);
      }

      // Calculate Indirect Attainment (average of Seminar and Work Project)
      console.log("Calculating Indirect Attainment...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const indirectValue =
          (coAttainment.seminar[coId] + coAttainment.workProject[coId]) / 2;
        coAttainment.indirect[coId] = Math.min(Math.max(indirectValue, 1), 3);
        console.log(
          `Indirect, ${coId}: Seminar=${
            coAttainment.seminar[coId]
          }, Work Project=${
            coAttainment.workProject[coId]
          }, Indirect Value=${coAttainment.indirect[coId].toFixed(2)}`
        );
      }

      // Calculate Overall Attainment (u * Direct + v * Indirect)
      console.log("Calculating Overall Attainment...");
      for (let k = 1; k <= 6; k++) {
        const coId = `CO${k}`;
        const overallValue =
          coAttainment.direct[coId] * parameters.u +
          coAttainment.indirect[coId] * parameters.v;
        coAttainment.overall[coId] = Math.min(Math.max(overallValue, 1), 3);
        targetAttained[coId] =
          coAttainment.overall[coId] >= parameters.targetAttainmentLevel;
        console.log(
          `Overall, ${coId}: ${coAttainment.overall[coId].toFixed(
            2
          )}, Target Attained: ${targetAttained[coId]}`
        );
      }

      console.log(
        "Final CO Attainment:",
        JSON.stringify(coAttainment, null, 2)
      );
      console.log("Target Attained:", targetAttained);

      // TODO: Store coAttainment in the database instead of in-memory
      // For now, we'll return the data
      res.json({ coAttainment, targetAttained, parameters });
    } catch (error) {
      console.error("Error uploading semester results:", error);
      res
        .status(500)
        .json({ error: "Failed to upload semester results: " + error.message });
    }
  }
);

// Sync database and seed a default user
sequelize
  .sync({ force: process.env.NODE_ENV !== "production" }) // Only force sync in development
  .then(async () => {
    // Check if the default user exists before creating
    const existingUser = await User.findOne({
      where: { email: "admin@example.com" },
    });
    if (!existingUser) {
      await User.create({
        email: "admin@example.com",
        password: await bcrypt.hash("password123", 10),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Default admin user created");
    } else {
      console.log("Default admin user already exists");
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Backend server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to sync database:", err);
    process.exit(1);
  });
