const mongoose = require("mongoose");

const attendanceSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  roll_no: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  course_id: {
    type: String,
    required: true,
    uppercase: true
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
