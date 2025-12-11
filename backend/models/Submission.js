import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  mentorName: { type: String, required: true },
  branch: { type: String, required: true },
  batchNo: { type: String },
  studentName: { type: String, required: true },
  semester: { type: String, required: true },
  section: { type: String },
  cytest: { type: String },
  mentorComments: { type: String },
  counselling: { type: String },
  studentFeedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
export default Submission;
