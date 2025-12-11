import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Submission from "./models/Submission.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/mentor_mentee";
const ADMIN_KEY = process.env.ADMIN_KEY || "admin_secret";

mongoose.connect(MONGO, { })
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Create submission (student)
app.post("/api/submissions", async (req, res) => {
  try {
    const payload = req.body;
    // Basic server-side validation
    if (!payload.mentorName || !payload.studentName || !payload.branch || !payload.semester) {
      return res.status(400).json({ error: "mentorName, studentName, branch and semester are required." });
    }
    const doc = new Submission(payload);
    await doc.save();
    return res.status(201).json({ message: "Saved", id: doc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


// Clear all (admin protected by header x-admin-key)
app.delete("/api/submissions", async (req, res) => {
  try {
    const key = req.headers["x-admin-key"];
    if (!key || key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
    await Submission.deleteMany({});
    return res.json({ message: "All records deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});
// Update student feedback (partial update)
app.patch("/api/submissions/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentFeedback } = req.body;
    if (!studentFeedback) return res.status(400).json({ error: "studentFeedback required" });

    const updated = await Submission.findByIdAndUpdate(
      id,
      { studentFeedback },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Record not found" });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/submissions?branch=CIVIL&semester=7
app.get("/api/submissions", async (req, res) => {
  try {
    const { branch, semester, search } = req.query;

    const filter = {};

    if (branch) filter.branch = branch;
    if (semester) filter.semester = semester;

    // STUDENT SEARCH FIX (IMPORTANT)
    if (search) {
      const regex = new RegExp(search, "i");
      const results = await Submission.find({
        $or: [
          { studentName: regex },
          { batchNo: regex }
        ]
      }).sort({ createdAt: -1 });

      return res.json(results);
    }

    // NORMAL ADMIN FILTER
    const data = await Submission.find(filter).sort({ createdAt: -1 });
    res.json(data);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(PORT, () => console.log(`Server started on ${PORT}`));
