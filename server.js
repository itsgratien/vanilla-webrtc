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
    const c = await offerModel.create(values);

    socket.broadcast.emit('notify-call', {
      callId: values.userId,
      offerId: c._id,
    });
  });

  socket.on('add-answer', async (values) => {
    const add = await answerModel.create(values);

    socket.emit('get-remote-answer', add);
  });

  socket.on('add-icecandidate', (values) => {
    socket.emit('get-icecandidate', values);
  });
});

const port = 3000;

server.listen(port, async () => {
  await connect();

  await createUsers();

  await dropTables();

  console.log(`server is listening on port ${port}`);
});
