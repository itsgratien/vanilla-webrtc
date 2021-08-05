const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    sdp: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
