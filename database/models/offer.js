const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    offer: {
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

module.exports = mongoose.model('Offer', offerSchema);
