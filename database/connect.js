const mongoose = require('mongoose');

const { userModel, offerModel, answerModel } = require('./models');

const connect = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/webrtc', {
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    throw error;
  }
};

const createUsers = async () => {
  try {
    const defaultUsers = ['johndoe', 'janedoe'];

    const findUser1 = await userModel.findOne({ username: defaultUsers[0] });

    if (!findUser1) {
      await userModel.create({ username: defaultUsers[0] });
    }

    const findUser2 = await userModel.findOne({ username: defaultUsers[1] });

    if (!findUser2) {
      await userModel.create({ username: defaultUsers[1] });
    }

    return;
  } catch (error) {
    throw error;
  }
};

const dropTables = async () => {
  try {
    await answerModel.deleteMany({});

    await offerModel.deleteMany({});

    return;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  connect,
  createUsers,
  dropTables,
};
