const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema({
  name: String,
  completed: Boolean,
  isDefault: Boolean
});

const monkModeSchema = new mongoose.Schema({
  currentDate: String,
  today: [routineSchema],
  history: {
    type: Map,
    of: [routineSchema]
  },
  logs: {
    type: Object,
    default: {}
  },
  rules: {
    type: [
      {
        text: String,
        createdAt: Date
      }
    ],
    default: []
  }
});

module.exports = mongoose.model("MonkMode", monkModeSchema);
