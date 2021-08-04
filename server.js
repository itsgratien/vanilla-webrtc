const express = require('express');

const user = require('./user');

const app = express();

const server = require('http').Server(app);

const io = require('socket.io')(server);

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.get('/', (req, res) => {
  const { username } = req.query;

  const find = user.find((item) => item.username === username);

  res.render('index', { user: find });
});

io.on('connection', (socket) => {
  socket.on('make-call', (value) => {
    const find = user.find((item) => item.username !== value.username);

    socket.broadcast.emit('incoming-call', {
      username: find.username,
      offer: value.offer,
    });
  });

  socket.on('answer', (value) => {
    socket.broadcast.emit('receive-answer', value);
  });

  socket.on('ice', (value) => {
    const { username, candidate } = value;

    socket.broadcast.emit('receive-ice', candidate);
  });
});

const port = 3000;

server.listen(port, () => console.log(`server is listening on port ${port}`));
