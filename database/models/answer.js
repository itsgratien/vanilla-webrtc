const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    answer: {
      type: Object,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Answer', answerSchema);
