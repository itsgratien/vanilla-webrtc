const express = require('express');

const { connect, createUsers, dropTables } = require('./database/connect');

const { userModel, offerModel, answerModel } = require('./database/models');

const app = express();

const server = require('http').Server(app);

const io = require('socket.io')(server);

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  const { username } = req.query;

  const find = await userModel.findOne({ username });

  res.render('index', { user: find });
});

app.get('/offer/:userId/:offerId', async (req, res) => {
  const get = await offerModel.findOne({
    $and: [{ userId: req.params.userId }, { _id: req.params.offerId }],
  });

  return res.json({ data: get });
});

app.put(`/answer/:userId/:answerId`, async (req, res) => {
  const u = await answerModel.findOneAndUpdate(
    { $and: [{ _id: req.params.answerId }, { userId: req.params.userId }] },
    { $set: { answer: req.body.answer } },
    { new: true }
  );

  return res.json({ data: u });
});

io.on('connection', (socket) => {
  socket.on('create-offer', async (values) => {
    try {
      const c = await offerModel.create({ ...values, userId: values.callId });

      socket.broadcast.emit('receive-offer', {
        callId: c.userId,
        offer: c.offer,
      });
    } catch (error) {
      console.log('createOfferError', error);
    }
  });

  socket.on('create-answer', async (value) => {
    try {
      const c = await answerModel.create(value);

      socket.broadcast.emit('receive-answer', {
        answer: c.answer,
        callId: c.callId,
        userId: c.userId,
      });
    } catch (error) {
      console.log('createAnswerError', error);
    }
  });

  socket.on('create-icecandidate', async (value) => {
    try {
      socket.emit('receive-icecandidate', value);
    } catch (error) {
      console.log('createIceCandidateError', error);
    }
  });
});

const port = 3000;

server.listen(port, async () => {
  await connect();

  await createUsers();

  await dropTables();

  console.log(`server is listening on port ${port}`);
});
